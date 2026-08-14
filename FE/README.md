# Linh Cosmetics Frontend

Ứng dụng React frontend cho shop mỹ phẩm cao cấp Linh Cosmetics.

## 🚀 Tech Stack

- **Core**: React 18, Vite, TypeScript
- **UI Framework**: Ant Design 5.x với custom theme
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: React Context API (Auth & Cart)
- **Icons**: Lucide React
- **HTTP Client**: Axios với interceptors
- **Routing**: React Router DOM v6

## 🎨 Design System

### Color Palette

- **Primary**: #BC8F8F (Rosy Brown)
- **Background**: #FDFBF7 (Warm White)
- **Text**: #2D2D2D (Charcoal), #555555 (Gray)

### Typography

- **Sans-serif**: Inter (primary)
- **Serif**: Playfair Display (headings)

### Design Principles

- Minimalist & Flat design
- Luxury cosmetic aesthetic
- Generous whitespace
- Subtle shadows and effects
- Glassmorphism header

## 📁 Project Structure

```
src/
├── components/
│   └── Layout/
│       └── MainLayout.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── CheckoutSuccessPage.tsx
│   └── OrdersPage.tsx
├── config/
│   └── theme.ts
├── utils/
│   ├── api.ts
│   └── helpers.ts
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 🔧 Installation & Setup

1. **Install dependencies**:

```bash
cd Linh-cosmetics-frontend
npm install
```

2. **Start development server**:

```bash
npm run dev
```

3. **Build for production**:

```bash
npm run build
```

## 🌐 API Integration

### Base Configuration

- **API Base URL**: `http://localhost:3000/api`
- **Static Files**: `http://localhost:3000/uploads`

### Authentication

- JWT token stored in localStorage
- Auto session ID generation for guest users
- Automatic token refresh and error handling

### Key Features

- **Auto Session Management**: Generates UUID for guest cart
- **Token Interceptors**: Auto-attach Bearer token
- **Error Handling**: Auto-redirect on 401 errors
- **Image URL Helper**: Automatic image path resolution

## 🛍️ Features

### 🏠 Homepage

- Hero carousel with call-to-action
- Featured products grid
- Company features showcase
- Newsletter signup

### 🛒 Product Catalog

- Advanced filtering (category, brand, price)
- Search functionality
- Pagination with meta data
- Responsive product grid

### 📱 Product Details

- Image gallery with thumbnails
- Add to cart with quantity selection
- Product reviews and ratings
- Related products suggestions

### 🔐 Authentication

- Login/Register forms with validation
- Auto-login after registration
- Protected routes
- User profile dropdown

### 🛒 Shopping Cart

- Real-time cart updates
- Quantity management
- Guest cart support (session-based)
- Shipping fee calculation

### 💳 Checkout Process

- Multi-step checkout flow
- Shipping information form
- Order summary
- COD payment method
- Success confirmation page

### 📦 Order Management

- Order history for logged-in users
- Order status tracking
- Detailed order information
- Responsive order cards

## 🎯 Key Components

### AuthContext

- User authentication state
- Login/register/logout functions
- Token management
- Auto-redirect handling

### CartContext

- Shopping cart state management
- Add/update/remove items
- Guest cart support
- Real-time total calculation

### MainLayout

- Sticky glassmorphism header
- Navigation menu
- Cart badge with item count
- User dropdown menu
- Responsive footer

## 🔧 Configuration

### Ant Design Theme

Custom theme configuration in `src/config/theme.ts`:

- Primary color: #BC8F8F
- Background: #FDFBF7
- Custom component styling
- Flat design tokens

### Tailwind CSS

Extended configuration for:

- Custom color palette
- Font families
- Responsive breakpoints
- Utility classes

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: xs(24), sm(12), md(8), lg(6), xl(4)
- Flexible grid system
- Touch-friendly interactions

## 🚀 Performance Optimizations

- Lazy loading for images
- Optimized bundle size
- Efficient re-renders with React Context
- Memoized components where needed

## 🔒 Security Features

- XSS protection
- CSRF token handling
- Secure token storage
- Input validation
- Error boundary implementation

## 🌍 Internationalization Ready

- Vietnamese language support
- Currency formatting (VND)
- Date/time localization
- RTL support ready

## 📞 Support

- **Hotline**: 1900 1234
- **Email**: info@Linhcosmetics.vn
- **Address**: 123 Nguyễn Huệ, Q1, TP.HCM

---

Developed with ❤️ for Linh Cosmetics
