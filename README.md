💰 Budgy - Personal Budget Management Application
A full-stack web application for managing personal finances through a budget pocket system.
Built with React and Django, Budgy helps users organise their income across different spending categories and track their financial goals.
Live Demo: https://budgy-d1ih.onrender.com

Features and Core Functionalities

Budget Pockets: Organise expenses into customisable categories (Essentials, Savings, Lifestyle)
Flexible Frequencies: Support for 7 time periods (daily, weekly, biweekly, monthly, quarterly, biannually, yearly)
Income Sorting: Distribute income across budget pockets for specific time periods or one-off payments
Percentage-Based Budgeting: Set budget items as fixed amounts or percentages
Calendar View: Visualise budget allocations over time
Currency Converter: Built-in converter supporting 33+ currencies with live exchange rates
User Profiles: Personalised settings including currency preferences

Technical Features

JWT-based authentication
Real-time budget calculations
Responsive design for mobile and desktop
Secure password management
PostgreSQL database with data persistence

How It Works
1. Budget Pockets
Users create "pockets" to represent different spending categories. 

Each pocket has:
Name: e.g., "Rent", "Groceries", "Emergency Fund"
Amount: Budget allocation
Frequency: How often this expense occurs (daily to yearly)
Category: Grouping for organiation
Color: Visual identification

2. Budget Items
Within each pocket, users can add specific items:

Fixed amounts (e.g., $1,200 for rent)
Percentage-based (e.g., 20% of income to savings)
Automatically calculated "Other" item for remaining pocket balance

3. Income Sorting
When receiving income, users can:

Enter the income amount
Select a time period (or one-off)
See how the income should be distributed across all pockets
Save the distribution for future reference

4. Frequency Conversion
The app intelligently converts between different time periods. For example:

A 1,200/month rent pocket = 400/week when sorting weekly income
A 50/week grocery budget = 2,600/year when viewing annual totals

Technology Stack
Frontend

React 19.2 - UI framework
Vite 7 - Build tool and development server
CSS 

Backend

Django REST Framework - API endpoints
PostgreSQL - Database
JWT Authentication - Secure token-based auth
Gunicorn - Production WSGI server
WhiteNoise - Static file serving

Deployment

Render - Hosting platform
PostgreSQL Database - Managed database service

Project Structure
budgy/
├── backend/
│   ├── api/
│   │   ├── models.py            # Database models (Pocket, Category, Item, etc.)
│   │   ├── views.py             # API endpoints and business logic
│   │   ├── serializers.py       # Data serialisation
│   │   ├── urls.py              # API routing
│   │   ├── frequency_utils.py   # Time period conversion utilities
│   │   └── income_sort_utils.py # Income distribution calculations
│   ├── backend/
│   │   ├── settings.py          # Django configuration
│   │   └── urls.py              # Main URL routing
│   ├── manage.py
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── PocketForm.jsx
│   │   │   └── ...
│   │   ├── pages/               # Main page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Pockets.jsx
│   │   │   ├── SortIncome.jsx
│   │   │   └── ...
│   │   ├── styles/.             # CSS files
│   │   ├── utils/               # Utility functions
│   │   ├── api.js               # Axios API configuration
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── build.sh                     # Deployment build script
└── README.md

Frequency Conversion System
The app uses a sophisticated frequency conversion system (frequency_utils.py) that:

Converts amounts between different time periods
Handles edge cases (e.g., months with different days)
Ensures accurate budget calculations regardless of input frequency

Income Sorting Algorithm
When sorting income (income_sort_utils.py):

Calculates total needed for each pocket in the specified period
Processes percentage-based items first
Allocates fixed amounts
Distributes remaining funds to "Other" items
Handles both periodic and one-off income

Potential improvements:
I intend on continuing working on this project, to extend it.
Adding encryption
Shared pockets between users
Exporting sorted incomes
Creating reports within the tool