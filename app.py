"""
VoteSahayak - Indian Election Process Interactive Assistant
A comprehensive Streamlit application for Indian citizens to understand the election process.
"""

import streamlit as st
import folium
from streamlit_folium import st_folium
from datetime import datetime
import json

# Page configuration
st.set_page_config(
    page_title="VoteSahayak – Indian Election Guide",
    page_icon="🗳️",
    layout="wide"
)

# Global CSS for dark theme and professional UI
st.markdown("""
<style>
    /* Global styles */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * {
        font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    .stApp {
        background-color: #0e1117;
        color: #fafafa;
    }

    /* Custom card container */
    .custom-card {
        background-color: #262730;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        border: 1px solid #3a3a4a;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .custom-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 16px rgba(255,153,51,0.2);
    }

    /* Feature cards on home */
    .feature-card {
        background: linear-gradient(135deg, #262730 0%, #1a1a24 100%);
        border-radius: 16px;
        padding: 30px;
        margin: 10px;
        border: 2px solid #3a3a4a;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .feature-card:hover {
        border-color: #FF9933;
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(255,153,51,0.3);
    }

    .feature-icon {
        font-size: 48px;
        margin-bottom: 15px;
    }

    .feature-title {
        font-size: 20px;
        font-weight: 600;
        color: #FF9933;
        margin-bottom: 10px;
    }

    .feature-desc {
        font-size: 14px;
        color: #b0b0b0;
    }

    /* Chat bubbles */
    .chat-message {
        padding: 12px 16px;
        border-radius: 15px;
        margin: 8px 0;
        max-width: 70%;
        animation: fadeIn 0.3s ease-in;
        word-wrap: break-word;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .user-message {
        background-color: #005c4b;
        color: white;
        margin-left: auto;
        border-bottom-right-radius: 4px;
    }

    .assistant-message {
        background-color: #202c33;
        color: #e9edef;
        margin-right: auto;
        border-bottom-left-radius: 4px;
    }

    /* Buttons */
    .stButton > button {
        background-color: #FF9933;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        font-weight: 600;
        transition: all 0.3s;
    }

    .stButton > button:hover {
        background-color: #046A38;
        box-shadow: 0 4px 12px rgba(4,106,56,0.4);
    }

    /* Timeline */
    .timeline {
        position: relative;
        padding: 20px 0;
    }

    .timeline-item {
        background-color: #262730;
        border-left: 4px solid #FF9933;
        padding: 20px;
        margin-bottom: 20px;
        border-radius: 0 12px 12px 0;
        position: relative;
    }

    .timeline-item::before {
        content: '';
        position: absolute;
        left: -12px;
        top: 20px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #FF9933;
        border: 4px solid #0e1117;
    }

    .timeline-date {
        color: #FF9933;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 5px;
    }

    .timeline-title {
        color: #fafafa;
        font-weight: 600;
        font-size: 18px;
        margin-bottom: 8px;
    }

    .timeline-desc {
        color: #b0b0b0;
        font-size: 14px;
    }

    /* Sidebar styling */
    .css-1d391kg {
        background-color: #1a1a24;
    }

    /* Expander */
    .streamlit-expanderHeader {
        background-color: #262730;
        border-radius: 8px;
        font-weight: 600;
    }

    /* Footer */
    .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: #1a1a24;
        text-align: center;
        padding: 10px;
        font-size: 12px;
        color: #888;
        border-top: 1px solid #3a3a4a;
        z-index: 999;
    }

    /* Quiz */
    .quiz-question {
        background-color: #262730;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border-left: 4px solid #046A38;
    }

    .score-display {
        background: linear-gradient(135deg, #FF9933 0%, #046A38 100%);
        color: white;
        padding: 30px;
        border-radius: 16px;
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        margin: 20px 0;
    }

    /* Info boxes */
    .info-box {
        background-color: #1a3a52;
        border-left: 4px solid #046A38;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }

    .warning-box {
        background-color: #4a3a1a;
        border-left: 4px solid #FF9933;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }

    /* Headings */
    h1, h2, h3 {
        color: #fafafa;
    }

    h1 {
        font-weight: 700;
        background: linear-gradient(90deg, #FF9933 0%, #046A38 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
</style>
""", unsafe_allow_html=True)

# Mock data for polling stations
POLLING_STATIONS = {
    "Kolkata": [
        {"name": "Kolkata Municipal Corporation Primary School", "lat": 22.5726, "lon": 88.3639, "address": "Park Street, Kolkata - 700016"},
        {"name": "Ballygunge Government High School", "lat": 22.5320, "lon": 88.3639, "address": "Ballygunge, Kolkata - 700019"},
        {"name": "Jadavpur University Campus", "lat": 22.4991, "lon": 88.3685, "address": "Jadavpur, Kolkata - 700032"}
    ],
    "Howrah": [
        {"name": "Howrah Municipal Corporation Office", "lat": 22.5958, "lon": 88.2636, "address": "Howrah Station Road, Howrah - 711101"},
        {"name": "Shibpur Dinobundhoo Institution", "lat": 22.5697, "lon": 88.3184, "address": "Shibpur, Howrah - 711102"},
        {"name": "Bally Municipality Hall", "lat": 22.6534, "lon": 88.3417, "address": "Bally, Howrah - 711201"}
    ],
    "South 24 Parganas": [
        {"name": "Diamond Harbour Government High School", "lat": 22.1890, "lon": 88.1931, "address": "Diamond Harbour - 743331"},
        {"name": "Baruipur Municipality Office", "lat": 22.3641, "lon": 88.4328, "address": "Baruipur - 700144"},
        {"name": "Sonarpur Community Hall", "lat": 22.4426, "lon": 88.4239, "address": "Sonarpur - 700150"}
    ],
    "North 24 Parganas": [
        {"name": "Barasat Government College", "lat": 22.7211, "lon": 88.4810, "address": "Barasat - 700124"},
        {"name": "Barrackpore Municipal Building", "lat": 22.7636, "lon": 88.3785, "address": "Barrackpore - 700120"},
        {"name": "Dum Dum Park Community Center", "lat": 22.6272, "lon": 88.4172, "address": "Dum Dum - 700055"}
    ],
    "Hooghly": [
        {"name": "Chinsurah R S Institution", "lat": 22.8943, "lon": 88.3961, "address": "Chinsurah - 712101"},
        {"name": "Chandannagar Municipal Office", "lat": 22.8697, "lon": 88.3679, "address": "Chandannagar - 712136"},
        {"name": "Serampore Town Hall", "lat": 22.7522, "lon": 88.3419, "address": "Serampore - 712201"}
    ]
}

# Quiz questions
QUIZ_QUESTIONS = [
    {
        "question": "What is the minimum age required to vote in India?",
        "options": ["16 years", "18 years", "21 years", "25 years"],
        "correct": 1
    },
    {
        "question": "What does EVM stand for?",
        "options": ["Electronic Voting Machine", "Electric Vote Monitor", "Electoral Voting Method", "Electronic Vote Manager"],
        "correct": 0
    },
    {
        "question": "What does NOTA stand for in Indian elections?",
        "options": ["Not On The Agenda", "None Of The Above", "New Official Tracking Application", "National Online Tracking Authority"],
        "correct": 1
    },
    {
        "question": "What is the Election Commission of India helpline number?",
        "options": ["100", "1950", "1091", "1800"],
        "correct": 1
    },
    {
        "question": "Which document is required for voter registration?",
        "options": ["Driving License only", "Aadhaar Card and Address Proof", "Passport only", "PAN Card only"],
        "correct": 1
    }
]

# Election timeline data (West Bengal Assembly Election 2026 - Mock)
ELECTION_TIMELINE = [
    {
        "date": "March 15, 2026",
        "title": "Issue of Notification",
        "description": "Election Commission announces the election schedule and process begins."
    },
    {
        "date": "March 22, 2026",
        "title": "Last Date for Nominations",
        "description": "Candidates must file their nomination papers by this date."
    },
    {
        "date": "March 24, 2026",
        "title": "Scrutiny of Nominations",
        "description": "Election officials review and verify all nomination papers."
    },
    {
        "date": "March 27, 2026",
        "title": "Last Date for Withdrawal",
        "description": "Candidates can withdraw their nominations until this date."
    },
    {
        "date": "April 20, 2026",
        "title": "Polling Day",
        "description": "Citizens cast their votes at designated polling stations."
    },
    {
        "date": "April 23, 2026",
        "title": "Counting & Results",
        "description": "Votes are counted and results are declared."
    }
]

# Voter journey steps
VOTER_JOURNEY_STEPS = [
    {
        "title": "Who Can Vote?",
        "icon": "✅",
        "content": """
        **Eligibility Criteria:**
        - Must be a citizen of India
        - Must be 18 years of age or above on the qualifying date
        - Must be a resident of the constituency where you want to register
        - Must not be disqualified under any law

        **Checklist:**
        - [ ] I am 18+ years old
        - [ ] I am an Indian citizen
        - [ ] I have proof of residence
        """
    },
    {
        "title": "Voter Registration (Form 6)",
        "icon": "📝",
        "content": """
        **How to Register:**
        1. Visit the National Voters' Service Portal (https://voters.eci.gov.in/)
        2. Click on 'Register as a New Voter'
        3. Fill Form 6 with required details
        4. Upload necessary documents
        5. Submit the application

        **Required Documents:**
        - Age proof (Birth certificate, School certificate, etc.)
        - Address proof (Aadhaar, Passport, Utility bill, etc.)
        - Recent passport-size photograph

        **Checklist:**
        - [ ] Form 6 filled correctly
        - [ ] Documents uploaded
        - [ ] Application submitted
        """
    },
    {
        "title": "Check Voter List",
        "icon": "🔍",
        "content": """
        **How to Check:**
        1. Visit https://voters.eci.gov.in/
        2. Click on 'Search Your Name in Electoral Roll'
        3. Enter your details (Name, State, District, etc.)
        4. View your voter details and polling station

        **What to Verify:**
        - Your name is spelled correctly
        - Your age and address are correct
        - Your polling station location

        **Checklist:**
        - [ ] Name verified in voter list
        - [ ] Details are correct
        - [ ] Polling station identified
        """
    },
    {
        "title": "Voter ID Card (EPIC)",
        "icon": "🪪",
        "content": """
        **About EPIC:**
        - EPIC stands for Electoral Photo Identity Card
        - Also known as Voter ID Card
        - Free of cost for all eligible citizens
        - Contains unique Voter ID number

        **How to Get:**
        1. After successful registration, card is issued within 7-10 days
        2. Download e-EPIC from NVSP portal
        3. Physical card delivered to registered address

        **Checklist:**
        - [ ] Registration approved
        - [ ] e-EPIC downloaded
        - [ ] Physical card received
        """
    },
    {
        "title": "Polling Day",
        "icon": "🗳️",
        "content": """
        **On Voting Day:**
        1. Carry your Voter ID or acceptable alternative ID
        2. Reach your polling station during voting hours (usually 7 AM - 6 PM)
        3. Show your ID to the polling officer
        4. Get your finger marked with indelible ink
        5. Cast your vote using the EVM

        **What to Bring:**
        - Voter ID Card (EPIC) or alternative photo ID
        - Voter slip (if issued)

        **Checklist:**
        - [ ] Know my polling station
        - [ ] ID card ready
        - [ ] Voting time planned
        """
    },
    {
        "title": "Results",
        "icon": "📊",
        "content": """
        **Counting Process:**
        - Votes are counted on the date announced by Election Commission
        - Counting begins early morning under strict supervision
        - Results are declared constituency-wise
        - Real-time updates available on ECI website

        **How to Check Results:**
        - Visit https://results.eci.gov.in/
        - Watch live news coverage
        - Check ECI mobile app

        **Checklist:**
        - [ ] Know the counting date
        - [ ] Track results online
        """
    }
]

# Initialize session state
if 'messages' not in st.session_state:
    st.session_state.messages = []

if 'groq_api_key' not in st.session_state:
    st.session_state.groq_api_key = None

if 'quiz_submitted' not in st.session_state:
    st.session_state.quiz_submitted = False

if 'quiz_score' not in st.session_state:
    st.session_state.quiz_score = 0

if 'user_name' not in st.session_state:
    st.session_state.user_name = ""


# Helper Functions

def create_map(district):
    """Create a Folium map with polling station markers for the selected district."""
    stations = POLLING_STATIONS.get(district, [])
    if not stations:
        return None

    # Center map on first station
    center_lat = stations[0]["lat"]
    center_lon = stations[0]["lon"]

    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=12,
        tiles="OpenStreetMap"
    )

    # Add markers for each polling station
    for station in stations:
        folium.Marker(
            location=[station["lat"], station["lon"]],
            popup=f"<b>{station['name']}</b><br>{station['address']}",
            tooltip=station["name"],
            icon=folium.Icon(color='orange', icon='info-sign')
        ).add_to(m)

    return m


def get_chatbot_response(user_message, api_key):
    """Get response from Groq API for the chatbot."""
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )

        # Prepare messages with system prompt
        messages = [
            {
                "role": "system",
                "content": """You are a helpful Indian Election Process Assistant. Your role is to:
                1. Answer questions about Indian elections, voting process, and election procedures
                2. Provide accurate, factual information about voter registration, polling, and election laws
                3. Be polite, professional, and encouraging to first-time voters
                4. Decline to answer questions that are not related to Indian elections
                5. Keep responses concise and easy to understand
                6. Use simple English suitable for all education levels

                If asked about topics unrelated to Indian elections, politely decline and redirect to election-related queries."""
            }
        ]

        # Add conversation history
        for msg in st.session_state.messages:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })

        # Get response from Groq
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Error: {str(e)}"


def generate_certificate_html(name, score):
    """Generate HTML with jsPDF script to create and download certificate."""
    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    </head>
    <body>
        <script>
            window.onload = function() {{
                const {{ jsPDF }} = window.jspdf;
                const doc = new jsPDF({{
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                }});

                // Background
                doc.setFillColor(14, 17, 23);
                doc.rect(0, 0, 297, 210, 'F');

                // Border
                doc.setDrawColor(255, 153, 51);
                doc.setLineWidth(2);
                doc.rect(10, 10, 277, 190);

                // Title
                doc.setFontSize(32);
                doc.setTextColor(255, 153, 51);
                doc.text('CERTIFICATE OF COMPLETION', 148.5, 40, {{ align: 'center' }});

                // Subtitle
                doc.setFontSize(18);
                doc.setTextColor(4, 106, 56);
                doc.text('Informed Voter Badge', 148.5, 55, {{ align: 'center' }});

                // Body text
                doc.setFontSize(14);
                doc.setTextColor(250, 250, 250);
                doc.text('This is to certify that', 148.5, 75, {{ align: 'center' }});

                // Name
                doc.setFontSize(24);
                doc.setTextColor(255, 153, 51);
                doc.text('{name}', 148.5, 95, {{ align: 'center' }});

                // Achievement text
                doc.setFontSize(14);
                doc.setTextColor(250, 250, 250);
                doc.text('has successfully completed the Indian Election Process Quiz', 148.5, 110, {{ align: 'center' }});
                doc.text('and demonstrated knowledge of the democratic voting process', 148.5, 120, {{ align: 'center' }});

                // Score
                doc.setFontSize(18);
                doc.setTextColor(4, 106, 56);
                doc.text('Score: {score}/5', 148.5, 140, {{ align: 'center' }});

                // Date
                doc.setFontSize(12);
                doc.setTextColor(176, 176, 176);
                doc.text('Date: {datetime.now().strftime("%B %d, %Y")}', 148.5, 160, {{ align: 'center' }});

                // Footer
                doc.setFontSize(10);
                doc.text('VoteSahayak - Indian Election Guide', 148.5, 180, {{ align: 'center' }});
                doc.text('Not affiliated with Election Commission of India', 148.5, 187, {{ align: 'center' }});

                // Save PDF
                doc.save('Informed_Voter_Certificate.pdf');
            }};
        </script>
    </body>
    </html>
    """
    return html_code


# Page Functions

def home_page():
    """Render the home page with welcome message and feature cards."""
    st.markdown("<h1 style='text-align: center; font-size: 48px; margin-top: 20px;'>🗳️ VoteSahayak</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; font-size: 18px; color: #b0b0b0; margin-bottom: 40px;'>Your Complete Guide to the Indian Election Process</p>", unsafe_allow_html=True)

    # Feature cards
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        <div class="feature-card">
            <div class="feature-icon">🗳️</div>
            <div class="feature-title">Voter Journey</div>
            <div class="feature-desc">Step-by-step guide from registration to voting</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="feature-card">
            <div class="feature-icon">💬</div>
            <div class="feature-title">AI Chat Assistant</div>
            <div class="feature-desc">Get instant answers to your election questions</div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="feature-card">
            <div class="feature-icon">📍</div>
            <div class="feature-title">Find Your Booth</div>
            <div class="feature-desc">Locate polling stations in your area</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<br><br>", unsafe_allow_html=True)

    # Info section
    st.markdown("""
    <div class="custom-card">
        <h2>🇮🇳 Welcome to India's Democratic Process</h2>
        <p style='font-size: 16px; line-height: 1.8; color: #e0e0e0;'>
            Every vote matters in shaping our nation's future. Whether you're a first-time voter or want to refresh your knowledge,
            VoteSahayak provides comprehensive guidance on the Indian election process. Learn about voter registration,
            understand your rights, find your polling station, and become an informed citizen.
        </p>
        <br>
        <p style='font-size: 14px; color: #FF9933;'><strong>👈 Use the sidebar navigation to explore different sections</strong></p>
    </div>
    """, unsafe_allow_html=True)

    # Quick stats
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown("""
        <div class="custom-card" style="text-align: center;">
            <h3 style="color: #FF9933; font-size: 32px;">18+</h3>
            <p style="color: #b0b0b0;">Minimum Voting Age</p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="custom-card" style="text-align: center;">
            <h3 style="color: #046A38; font-size: 32px;">1950</h3>
            <p style="color: #b0b0b0;">ECI Helpline Number</p>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="custom-card" style="text-align: center;">
            <h3 style="color: #FF9933; font-size: 32px;">Free</h3>
            <p style="color: #b0b0b0;">Voter Registration</p>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        st.markdown("""
        <div class="custom-card" style="text-align: center;">
            <h3 style="color: #046A38; font-size: 32px;">Safe</h3>
            <p style="color: #b0b0b0;">Voting Process</p>
        </div>
        """, unsafe_allow_html=True)


def voter_journey_page():
    """Render the voter journey page with expandable steps."""
    st.title("🗳️ Your Voting Journey")
    st.markdown("Follow these steps to exercise your democratic right to vote in India.")
    st.markdown("<br>", unsafe_allow_html=True)

    for step in VOTER_JOURNEY_STEPS:
        with st.expander(f"{step['icon']} {step['title']}", expanded=False):
            st.markdown(f"<div class='custom-card'>{step['content']}</div>", unsafe_allow_html=True)


def polling_station_page():
    """Render the polling station locator page with map."""
    st.title("📍 Find Your Polling Station")
    st.markdown("Select your district to view nearby polling stations on the map.")
    st.markdown("<br>", unsafe_allow_html=True)

    col1, col2 = st.columns([1, 2])

    with col1:
        district = st.selectbox(
            "Select District",
            options=list(POLLING_STATIONS.keys()),
            index=0
        )

        search_query = st.text_input("🔍 Search polling station", placeholder="Enter booth name...")

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### Polling Stations in " + district)

        stations = POLLING_STATIONS[district]
        filtered_stations = stations

        if search_query:
            filtered_stations = [s for s in stations if search_query.lower() in s["name"].lower()]

        for station in filtered_stations:
            st.markdown(f"""
            <div class="custom-card">
                <h4 style="color: #FF9933; margin-bottom: 8px;">{station['name']}</h4>
                <p style="color: #b0b0b0; font-size: 14px; margin: 0;">📍 {station['address']}</p>
            </div>
            """, unsafe_allow_html=True)

    with col2:
        m = create_map(district)
        if m:
            st_folium(m, width=700, height=600)


def chatbot_page():
    """Render the AI chatbot page with WhatsApp-style interface."""
    st.title("💬 AI Election Assistant")
    st.markdown("Ask any questions about the Indian election process.")

    # API Key input in sidebar (moved to this page section)
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 🔑 Groq API Configuration")

        # Try to get from secrets first
        api_key_from_secrets = None
        try:
            api_key_from_secrets = st.secrets.get("GROQ_API_KEY")
        except:
            pass

        if api_key_from_secrets:
            st.session_state.groq_api_key = api_key_from_secrets
            st.success("API key loaded from secrets")
        else:
            user_api_key = st.text_input(
                "Enter your Groq API Key",
                type="password",
                value=st.session_state.groq_api_key or "",
                help="Get your free API key from https://console.groq.com/"
            )
            if user_api_key:
                st.session_state.groq_api_key = user_api_key
                st.success("API key set!")

    # Check if API key is available
    if not st.session_state.groq_api_key:
        st.warning("⚠️ Please enter your Groq API key in the sidebar to start chatting.")
        st.markdown("""
        <div class="info-box">
            <h4>How to get a Groq API key:</h4>
            <ol>
                <li>Visit <a href="https://console.groq.com/" target="_blank">console.groq.com</a></li>
                <li>Sign up for a free account</li>
                <li>Navigate to API Keys section</li>
                <li>Create a new API key</li>
                <li>Copy and paste it in the sidebar</li>
            </ol>
        </div>
        """, unsafe_allow_html=True)
        return

    # Chat container
    chat_container = st.container()

    with chat_container:
        # Display chat history
        for message in st.session_state.messages:
            if message["role"] == "user":
                st.markdown(f"""
                <div style="display: flex; justify-content: flex-end; margin: 8px 0;">
                    <div class="chat-message user-message">{message["content"]}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="display: flex; justify-content: flex-start; margin: 8px 0;">
                    <div class="chat-message assistant-message">{message["content"]}</div>
                </div>
                """, unsafe_allow_html=True)

    # Chat input
    user_input = st.chat_input("Type your question here...")

    if user_input:
        # Add user message to history
        st.session_state.messages.append({
            "role": "user",
            "content": user_input
        })

        # Get bot response
        with st.spinner("Thinking..."):
            response = get_chatbot_response(user_input, st.session_state.groq_api_key)

        # Add assistant response to history
        st.session_state.messages.append({
            "role": "assistant",
            "content": response
        })

        # Rerun to update chat display
        st.rerun()

    # Clear chat button
    if st.session_state.messages:
        if st.button("🗑️ Clear Chat History"):
            st.session_state.messages = []
            st.rerun()


def timeline_page():
    """Render the election timeline page."""
    st.title("⏳ Election Timeline")
    st.markdown("**West Bengal Assembly Election 2026** - Key Dates")
    st.markdown("<br>", unsafe_allow_html=True)

    for item in ELECTION_TIMELINE:
        st.markdown(f"""
        <div class="timeline-item">
            <div class="timeline-date">{item['date']}</div>
            <div class="timeline-title">{item['title']}</div>
            <div class="timeline-desc">{item['description']}</div>
        </div>
        """, unsafe_allow_html=True)


def quiz_page():
    """Render the quiz page with certificate generation."""
    st.title("🧠 Test Your Knowledge")
    st.markdown("Take this quick quiz to test your understanding of the Indian election process.")
    st.markdown("<br>", unsafe_allow_html=True)

    if not st.session_state.quiz_submitted:
        # Get user name
        user_name = st.text_input("Enter your name for the certificate:", value=st.session_state.user_name)
        st.session_state.user_name = user_name

        st.markdown("<br>", unsafe_allow_html=True)

        # Display questions
        user_answers = []

        for i, q in enumerate(QUIZ_QUESTIONS):
            st.markdown(f"""
            <div class="quiz-question">
                <h4>Question {i+1}: {q['question']}</h4>
            </div>
            """, unsafe_allow_html=True)

            answer = st.radio(
                f"Select your answer for Question {i+1}:",
                options=q['options'],
                key=f"q_{i}",
                label_visibility="collapsed"
            )
            user_answers.append(answer)

            st.markdown("<br>", unsafe_allow_html=True)

        # Submit button
        if st.button("📝 Submit & Get Certificate", type="primary"):
            if not user_name:
                st.error("Please enter your name to receive the certificate.")
            else:
                # Calculate score
                score = 0
                for i, q in enumerate(QUIZ_QUESTIONS):
                    if user_answers[i] == q['options'][q['correct']]:
                        score += 1

                st.session_state.quiz_score = score
                st.session_state.quiz_submitted = True
                st.rerun()

    else:
        # Show results
        score = st.session_state.quiz_score
        percentage = (score / len(QUIZ_QUESTIONS)) * 100

        st.markdown(f"""
        <div class="score-display">
            🎉 Congratulations, {st.session_state.user_name}!<br>
            Your Score: {score}/{len(QUIZ_QUESTIONS)} ({percentage:.0f}%)
        </div>
        """, unsafe_allow_html=True)

        if score >= 3:
            st.success("✅ Well done! You have a good understanding of the Indian election process.")
        else:
            st.info("📚 Consider reviewing the Voter Journey section to learn more.")

        st.markdown("<br>", unsafe_allow_html=True)

        # Show correct answers
        st.markdown("### 📋 Correct Answers:")
        for i, q in enumerate(QUIZ_QUESTIONS):
            st.markdown(f"**{i+1}. {q['question']}**")
            st.markdown(f"✓ {q['options'][q['correct']]}")
            st.markdown("<br>", unsafe_allow_html=True)

        # Generate certificate
        st.markdown("### 📜 Download Your Certificate")
        st.markdown("Click below to download your Informed Voter Certificate:")

        certificate_html = generate_certificate_html(st.session_state.user_name, score)
        st.components.v1.html(certificate_html, height=0)

        st.markdown("""
        <div class="info-box">
            <p>✨ Your certificate should download automatically. If not, please check your browser's download settings.</p>
        </div>
        """, unsafe_allow_html=True)

        # Retake button
        if st.button("🔄 Retake Quiz"):
            st.session_state.quiz_submitted = False
            st.session_state.quiz_score = 0
            st.rerun()


def registration_guide_page():
    """Render the voter registration guide page."""
    st.title("📋 Voter Registration Guide")
    st.markdown("Complete guide to registering as a voter in India.")
    st.markdown("<br>", unsafe_allow_html=True)

    # Required documents
    st.markdown("""
    <div class="custom-card">
        <h2>📄 Required Documents</h2>
        <ul style="font-size: 16px; line-height: 2;">
            <li><strong>Age Proof:</strong> Birth Certificate, School Leaving Certificate, PAN Card, or Passport</li>
            <li><strong>Address Proof:</strong> Aadhaar Card, Passport, Driving License, Utility Bills (electricity, water, gas), or Bank Passbook</li>
            <li><strong>Recent Passport-size Photograph</strong></li>
            <li><strong>Mobile Number</strong> (for OTP verification)</li>
            <li><strong>Email Address</strong> (optional but recommended)</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

    # Step-by-step instructions
    st.markdown("""
    <div class="custom-card">
        <h2>📝 Registration Steps (Form 6)</h2>
        <ol style="font-size: 16px; line-height: 2;">
            <li><strong>Visit the NVSP Portal:</strong> Go to <a href="https://voters.eci.gov.in/" target="_blank" style="color: #FF9933;">https://voters.eci.gov.in/</a></li>
            <li><strong>Select 'Register as a New Voter'</strong> from the homepage</li>
            <li><strong>Fill Form 6:</strong> Enter personal details (name, date of birth, gender, etc.)</li>
            <li><strong>Enter Address Details:</strong> Current residential address with PIN code</li>
            <li><strong>Upload Documents:</strong> Scan and upload age proof and address proof</li>
            <li><strong>Upload Photo:</strong> Recent passport-size color photograph</li>
            <li><strong>Verify with OTP:</strong> Enter OTP sent to your mobile number</li>
            <li><strong>Submit Application:</strong> Review all details and submit</li>
            <li><strong>Note Reference Number:</strong> Save the reference number for tracking</li>
        </ol>
    </div>
    """, unsafe_allow_html=True)

    # Offline registration
    st.markdown("""
    <div class="custom-card">
        <h2>🏢 Offline Registration</h2>
        <p style="font-size: 16px; line-height: 1.8;">
            You can also register offline by visiting your local Electoral Registration Officer (ERO) office:
        </p>
        <ol style="font-size: 16px; line-height: 2;">
            <li>Download Form 6 from the ECI website or collect it from the ERO office</li>
            <li>Fill the form with black pen in capital letters</li>
            <li>Attach self-attested photocopies of documents</li>
            <li>Paste your photograph in the designated space</li>
            <li>Submit the form to your ERO office or designated center</li>
        </ol>
    </div>
    """, unsafe_allow_html=True)

    # Important links
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        <div class="custom-card">
            <h3>🔗 Official Portal</h3>
            <p><a href="https://voters.eci.gov.in/" target="_blank" style="color: #FF9933; font-size: 18px;">National Voters' Service Portal</a></p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="custom-card">
            <h3>📱 Voter Helpline App</h3>
            <p style="color: #b0b0b0;">Download from Play Store / App Store</p>
        </div>
        """, unsafe_allow_html=True)

    # Processing time
    st.markdown("""
    <div class="info-box">
        <h3>⏱️ Processing Time</h3>
        <p style="font-size: 16px;">
            Your application will be processed within 7-10 working days. You can track the status using your reference number on the NVSP portal.
        </p>
    </div>
    """, unsafe_allow_html=True)


def helpline_page():
    """Render the Election Commission helpline page."""
    st.title("📞 Election Commission Helpline")
    st.markdown("Get help and support for election-related queries.")
    st.markdown("<br>", unsafe_allow_html=True)

    # Helpline number
    st.markdown("""
    <div class="custom-card" style="text-align: center; padding: 40px;">
        <h1 style="font-size: 64px; color: #FF9933; margin: 0;">1950</h1>
        <p style="font-size: 24px; color: #b0b0b0; margin-top: 10px;">National Voter Helpline</p>
        <p style="font-size: 16px; color: #888; margin-top: 20px;">Available Monday to Friday, 9:00 AM to 6:00 PM</p>
    </div>
    """, unsafe_allow_html=True)

    # Official websites
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        <div class="custom-card">
            <h3>🌐 Official Websites</h3>
            <ul style="font-size: 16px; line-height: 2;">
                <li><a href="https://eci.gov.in/" target="_blank" style="color: #FF9933;">Election Commission of India</a></li>
                <li><a href="https://voters.eci.gov.in/" target="_blank" style="color: #FF9933;">National Voters' Service Portal</a></li>
                <li><a href="https://results.eci.gov.in/" target="_blank" style="color: #FF9933;">Election Results</a></li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="custom-card">
            <h3>📧 Contact Information</h3>
            <ul style="font-size: 16px; line-height: 2;">
                <li><strong>Email:</strong> complaints@eci.gov.in</li>
                <li><strong>Toll-Free:</strong> 1800-111-950</li>
                <li><strong>SMS:</strong> 1950</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

    # FAQs
    st.markdown("### ❓ Frequently Asked Questions")

    with st.expander("How do I check if my name is in the voter list?"):
        st.markdown("""
        Visit the NVSP portal (https://voters.eci.gov.in/), click on 'Search in Electoral Roll',
        and enter your details like name, state, district, and assembly constituency.
        """)

    with st.expander("What if I made a mistake in my voter registration?"):
        st.markdown("""
        You can make corrections using Form 8 on the NVSP portal. Select 'Correction in Electoral Roll'
        and fill in the correct details along with supporting documents.
        """)

    with st.expander("Can I vote if I lost my Voter ID card?"):
        st.markdown("""
        Yes! You can vote using alternative photo identity documents like Aadhaar Card, Passport,
        Driving License, PAN Card, or other government-issued IDs with photographs.
        """)

    with st.expander("How do I change my polling station?"):
        st.markdown("""
        You can request a change of polling station using Form 8A on the NVSP portal if you have
        shifted within the same constituency. For inter-constituency changes, you need to register afresh.
        """)

    with st.expander("What is NOTA and when can I use it?"):
        st.markdown("""
        NOTA stands for 'None of the Above'. It's an option on the EVM that allows you to express
        your right to vote while rejecting all candidates. Press the NOTA button on the ballot unit if you wish to use it.
        """)

    with st.expander("How do I file a complaint about electoral malpractice?"):
        st.markdown("""
        You can file complaints through:
        - Call the 1950 helpline
        - Use the cVIGIL mobile app (for instant reporting with photo/video evidence)
        - Email to complaints@eci.gov.in
        - Visit your local Election Commission office
        """)


# Main App Logic

def main():
    """Main application logic with sidebar navigation."""

    # Sidebar navigation
    with st.sidebar:
        st.markdown("## 🗳️ VoteSahayak")
        st.markdown("---")

        page = st.radio(
            "Navigation",
            options=[
                "🏠 Home",
                "🗳️ Voter Journey",
                "📍 Find Booth",
                "💬 Chat Assistant",
                "⏳ Timeline",
                "🧠 Quiz",
                "📋 Registration",
                "📞 Helpline"
            ],
            label_visibility="collapsed"
        )

        st.markdown("---")
        st.markdown("**Quick Links:**")
        st.markdown("- [ECI Website](https://eci.gov.in/)")
        st.markdown("- [Voter Portal](https://voters.eci.gov.in/)")
        st.markdown("- [Check Results](https://results.eci.gov.in/)")

    # Route to appropriate page
    if page == "🏠 Home":
        home_page()
    elif page == "🗳️ Voter Journey":
        voter_journey_page()
    elif page == "📍 Find Booth":
        polling_station_page()
    elif page == "💬 Chat Assistant":
        chatbot_page()
    elif page == "⏳ Timeline":
        timeline_page()
    elif page == "🧠 Quiz":
        quiz_page()
    elif page == "📋 Registration":
        registration_guide_page()
    elif page == "📞 Helpline":
        helpline_page()

    # Footer
    st.markdown("""
    <div class="footer">
        Made for Indian Democracy 🇮🇳 | Not affiliated with Election Commission of India
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
