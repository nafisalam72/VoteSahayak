"""
VoteSahayak legacy Streamlit app.

The production Cloud Run deployment uses server.js + the React app. This
Streamlit entry point is kept as a safe local fallback with the same security
principles: server-side secrets, input sanitization, per-session rate limiting,
friendly errors, and structured logs for Google Cloud Logging.
"""

from __future__ import annotations

from datetime import datetime
import html
import json
import logging
import os
import re
import time
from typing import Iterable

import folium
import streamlit as st
from streamlit_folium import st_folium


SERVICE_NAME = "votesahayak-streamlit"
MAX_CHAT_INPUT_LENGTH = 500
MAX_REPLY_LENGTH = 2000
CHAT_RATE_LIMIT_MAX = int(os.getenv("CHAT_RATE_LIMIT_MAX", "12"))
CHAT_RATE_LIMIT_WINDOW_SECONDS = 60
SAFE_TEXT_PATTERN = re.compile(r"[\x00-\x1f\x7f<>]")

logging.basicConfig(level=logging.INFO, format="%(message)s")
LOGGER = logging.getLogger(SERVICE_NAME)


POLLING_STATIONS = {
    "Kolkata": [
        {
            "name": "Kolkata Municipal Corporation Primary School",
            "lat": 22.5726,
            "lon": 88.3639,
            "address": "Park Street, Kolkata - 700016",
        },
        {
            "name": "Ballygunge Government High School",
            "lat": 22.5320,
            "lon": 88.3639,
            "address": "Ballygunge, Kolkata - 700019",
        },
        {
            "name": "Jadavpur University Campus",
            "lat": 22.4991,
            "lon": 88.3685,
            "address": "Jadavpur, Kolkata - 700032",
        },
    ],
    "Howrah": [
        {
            "name": "Howrah District School",
            "lat": 22.5958,
            "lon": 88.2636,
            "address": "Howrah Maidan, Howrah - 711101",
        },
        {
            "name": "Shibpur Primary School",
            "lat": 22.5777,
            "lon": 88.3260,
            "address": "Shibpur, Howrah - 711102",
        },
    ],
    "Hooghly": [
        {
            "name": "Chinsurah High School",
            "lat": 22.9012,
            "lon": 88.3899,
            "address": "Chinsurah, Hooghly - 712101",
        }
    ],
}

QUIZ_QUESTIONS = [
    {
        "question": "What is the minimum voting age in India?",
        "options": ["16 Years", "18 Years", "21 Years", "25 Years"],
        "answer": "18 Years",
    },
    {
        "question": "Which form is used to register as a new voter?",
        "options": ["Form 4", "Form 6", "Form 8", "Form 9"],
        "answer": "Form 6",
    },
    {
        "question": "What does EVM stand for?",
        "options": [
            "Electronic Voting Machine",
            "Electoral Validating Machine",
            "Electronic Verification Module",
            "Election Value Metric",
        ],
        "answer": "Electronic Voting Machine",
    },
    {
        "question": "Which helpline number supports voters in India?",
        "options": ["100", "108", "1950", "181"],
        "answer": "1950",
    },
]


def log_event(severity: str, message: str, **metadata: object) -> None:
    """Emit a Cloud Logging compatible JSON log line."""
    LOGGER.info(
        json.dumps(
            {
                "severity": severity,
                "message": message,
                "service": SERVICE_NAME,
                "time": datetime.utcnow().isoformat() + "Z",
                **metadata,
            }
        )
    )


def sanitize_text(value: object, max_length: int = MAX_CHAT_INPUT_LENGTH) -> str:
    """Normalize and bound user-controlled text before use."""
    cleaned = SAFE_TEXT_PATTERN.sub(" ", str(value or ""))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:max_length]


def escape_text(value: object, max_length: int = MAX_REPLY_LENGTH) -> str:
    return html.escape(sanitize_text(value, max_length))


def get_configured_groq_key() -> str | None:
    """Read secrets only from trusted server-side configuration."""
    try:
        secret_key = st.secrets.get("GROQ_API_KEY")
        if secret_key:
            return str(secret_key)
    except Exception:
        pass
    return os.getenv("GROQ_API_KEY")


def is_chat_rate_limited() -> bool:
    """Per-session rate limiter for Streamlit's stateful runtime."""
    now = time.time()
    timestamps = st.session_state.setdefault("chat_timestamps", [])
    st.session_state.chat_timestamps = [
        timestamp
        for timestamp in timestamps
        if now - timestamp < CHAT_RATE_LIMIT_WINDOW_SECONDS
    ]
    if len(st.session_state.chat_timestamps) >= CHAT_RATE_LIMIT_MAX:
        return True
    st.session_state.chat_timestamps.append(now)
    return False


def initialize_state() -> None:
    st.session_state.setdefault("messages", [])
    st.session_state.setdefault("chat_timestamps", [])
    st.session_state.setdefault("quiz_submitted", False)
    st.session_state.setdefault("quiz_score", 0)


def configure_page() -> None:
    st.set_page_config(
        page_title="VoteSahayak - Indian Election Guide",
        page_icon="VS",
        layout="wide",
    )


def render_cards(cards: Iterable[tuple[str, str]]) -> None:
    card_list = list(cards)
    cols = st.columns(len(card_list))
    for column, (title, body) in zip(cols, card_list):
        with column:
            with st.container(border=True):
                st.subheader(sanitize_text(title, 120))
                st.write(sanitize_text(body, 400))


def create_map(district: str) -> folium.Map | None:
    stations = POLLING_STATIONS.get(district)
    if not stations:
        return None

    first_station = stations[0]
    election_map = folium.Map(
        location=[first_station["lat"], first_station["lon"]],
        zoom_start=12,
        tiles="OpenStreetMap",
    )

    for station in stations:
        popup = f"<b>{html.escape(station['name'])}</b><br>{html.escape(station['address'])}"
        folium.Marker(
            location=[station["lat"], station["lon"]],
            popup=popup,
            tooltip=html.escape(station["name"]),
            icon=folium.Icon(color="orange", icon="info-sign"),
        ).add_to(election_map)

    return election_map


def get_chatbot_response(user_message: str, api_key: str) -> str:
    """Call Groq through the OpenAI-compatible SDK with sanitized context."""
    sanitized_message = sanitize_text(user_message)
    if not sanitized_message:
        return "Please enter a valid election-related question."

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        messages = [
            {
                "role": "system",
                "content": (
                    "You are VoteSahayak, a civic assistant for Indian elections. "
                    "Answer only election, voter registration, EVM, VVPAT, polling "
                    "station, accessibility, candidate information, and complaint "
                    "questions. Keep answers under 150 words and direct users to "
                    "official ECI sources or helpline 1950 for critical details."
                ),
            }
        ]

        for message in st.session_state.messages[-8:]:
            messages.append(
                {
                    "role": message.get("role", "user"),
                    "content": sanitize_text(message.get("content", ""), MAX_REPLY_LENGTH),
                }
            )
        messages.append({"role": "user", "content": sanitized_message})

        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=messages,
            temperature=0.2,
            max_tokens=500,
        )
        return sanitize_text(response.choices[0].message.content, MAX_REPLY_LENGTH)
    except Exception as error:
        log_event(
            "ERROR",
            "Legacy Streamlit chat request failed",
            error_type=type(error).__name__,
        )
        return "Sorry, the AI assistant could not respond right now. Please try again shortly."


def home_page() -> None:
    st.title("VoteSahayak")
    st.subheader("A secure guide to Indian voter registration, polling, and support.")
    render_cards(
        [
            ("Secure AI", "Secrets stay server-side and all chat input is validated."),
            ("Voter Support", "1950 helpline, registration guidance, and official links."),
            ("Cloud Ready", "Structured logs, rate limits, and Cloud Run health checks."),
        ]
    )
    st.info("This app is educational and is not affiliated with the Election Commission of India.")


def voter_journey_page() -> None:
    st.title("Voter Journey")
    steps = [
        ("1. Check eligibility", "You must be an Indian citizen and 18 years or older."),
        ("2. Register with Form 6", "Apply at the official voters portal or through the voter helpline app."),
        ("3. Verify details", "Track application status and confirm your electoral roll entry."),
        ("4. Vote securely", "Carry an accepted ID and follow polling booth instructions."),
    ]
    for title, body in steps:
        with st.container(border=True):
            st.subheader(title)
            st.write(body)


def polling_station_page() -> None:
    st.title("Polling Station Locator")
    district = st.selectbox("Select district", sorted(POLLING_STATIONS.keys()))
    election_map = create_map(district)
    if election_map:
        st_folium(election_map, width=900, height=520)


def chatbot_page() -> None:
    st.title("AI Election Assistant")
    st.caption("Ask election-related questions. Do not enter sensitive personal data.")

    api_key = get_configured_groq_key()
    if not api_key:
        st.warning("AI is not configured. Set GROQ_API_KEY in Cloud Run or Streamlit secrets.")
        return

    for message in st.session_state.messages:
        role = "user" if message.get("role") == "user" else "assistant"
        with st.chat_message(role):
            st.write(sanitize_text(message.get("content", ""), MAX_REPLY_LENGTH))

    user_input = st.chat_input("Type your election question here")
    if user_input:
        sanitized_input = sanitize_text(user_input)
        if not sanitized_input:
            st.warning("Please enter a valid question.")
            return
        if is_chat_rate_limited():
            st.warning("Too many chat requests. Please wait a minute and try again.")
            return

        st.session_state.messages.append({"role": "user", "content": sanitized_input})
        with st.spinner("Thinking..."):
            reply = get_chatbot_response(sanitized_input, api_key)
        st.session_state.messages.append({"role": "assistant", "content": reply})
        st.rerun()

    if st.session_state.messages and st.button("Clear chat history"):
        st.session_state.messages = []
        st.session_state.chat_timestamps = []
        st.rerun()


def timeline_page() -> None:
    st.title("Election Timeline")
    for date, title, body in [
        ("Announcement", "Election schedule", "ECI announces phases, dates, and rules."),
        ("Nomination", "Candidate filing", "Candidates submit nominations and affidavits."),
        ("Polling", "Voting day", "Voters cast ballots at designated polling booths."),
        ("Counting", "Results", "Votes are counted and official results are published."),
    ]:
        st.markdown(f"**{date}: {title}**")
        st.write(body)


def quiz_page() -> None:
    st.title("Voter Knowledge Quiz")
    with st.form("quiz-form"):
        answers = []
        for index, question in enumerate(QUIZ_QUESTIONS, start=1):
            answers.append(st.radio(f"{index}. {question['question']}", question["options"]))
        submitted = st.form_submit_button("Submit quiz")

    if submitted:
        score = sum(
            1 for answer, question in zip(answers, QUIZ_QUESTIONS) if answer == question["answer"]
        )
        st.session_state.quiz_score = score
        st.session_state.quiz_submitted = True

    if st.session_state.quiz_submitted:
        st.success(f"You scored {st.session_state.quiz_score}/{len(QUIZ_QUESTIONS)}.")


def registration_guide_page() -> None:
    st.title("Registration Guide")
    st.markdown(
        """
        - Use Form 6 for new voter registration.
        - Use Form 7 for deletion or objection.
        - Use Form 8 for correction, shifting, or replacement EPIC.
        - Verify final details at https://voters.eci.gov.in/.
        """
    )


def helpline_page() -> None:
    st.title("Help and Support")
    st.markdown(
        """
        - National voter helpline: 1950
        - Official voters portal: https://voters.eci.gov.in/
        - cVIGIL reporting: https://cvigil.eci.gov.in/
        - ECI website: https://eci.gov.in/
        """
    )


def main() -> None:
    configure_page()
    initialize_state()

    with st.sidebar:
        st.header("VoteSahayak")
        page = st.radio(
            "Navigation",
            [
                "Home",
                "Voter Journey",
                "Find Booth",
                "Chat Assistant",
                "Timeline",
                "Quiz",
                "Registration",
                "Helpline",
            ],
        )

    routes = {
        "Home": home_page,
        "Voter Journey": voter_journey_page,
        "Find Booth": polling_station_page,
        "Chat Assistant": chatbot_page,
        "Timeline": timeline_page,
        "Quiz": quiz_page,
        "Registration": registration_guide_page,
        "Helpline": helpline_page,
    }
    routes[page]()


if __name__ == "__main__":
    main()
