# Auralis - Premium Audio Gear Store

Auralis is a modern, high-end e-commerce frontend application built for audiophiles. It offers a sleek and premium user experience for browsing and purchasing top-tier audio equipment, including active noise-cancelling headphones, professional studio monitors, acoustic tower speakers, and audiophile accessories like DACs and vintage record players.

## Tech Stack
- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v7
- **Styling:** Custom CSS with modern CSS Variables (Inter & Montserrat fonts)
- **Icons:** Lucide React

## Project Features
- **Responsive Design:** A fully responsive layout that looks great on mobile, tablet, and desktop devices.
- **Dynamic Routing:** Seamless navigation between Home, Shop, About, Contact, and Cart pages.
- **Product Filtering:** A dedicated shop page with category filters (Headphones, Speakers, Accessories) and a dynamic price range slider.
- **Cart Management:** A context-based shopping cart system that tracks items and updates the cart badge in real-time.
- **Premium UI/UX:** Smooth CSS animations (fade-ins), high-quality imagery, and a sleek Indigo/Slate color palette to reinforce the brand's modern tech aesthetic.

## Pages & Components
- **Home (`/`):** Features a striking hero section, category navigation, a grid of top-selling gear, and customer testimonials.
- **Shop (`/shop`):** A comprehensive product grid with a sidebar for filtering by category and max price.
- **Product Details (`/product/:id`):** (In progress/Available depending on routing configuration) Detailed view for individual products.
- **About (`/about`):** Details the history and mission of Auralis, founded in Seattle, dedicated to perfecting sound.
- **Contact (`/contact`):** A functional-looking contact form and store details (Email: contact@auralis.audio).
- **Cart (`/cart`):** Displays selected items ready for checkout.

## How to Run Locally

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

## Design Tokens
- **Primary Color:** Indigo (`#4F46E5`)
- **Fonts:** `Montserrat` (Headings), `Inter` (Body Text)
- **Vibe:** Sleek, tech-forward, minimalist, and professional.
