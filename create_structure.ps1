# create_structure.ps1
# Run this inside the ecofinds folder.

$folders = @(
    "backend/config",
    "backend/models",
    "backend/routes",
    "backend/middleware",
    "backend/controllers",
    "backend/utils",
    "backend/uploads/products",
    "frontend/public/assets/images",
    "frontend/public/assets/icons",
    "frontend/src/components/common",
    "frontend/src/components/auth",
    "frontend/src/components/products",
    "frontend/src/components/user",
    "frontend/src/components/cart",
    "frontend/src/pages",
    "frontend/src/context",
    "frontend/src/services",
    "frontend/src/utils",
    "frontend/src/styles/components",
    "frontend/src/styles/pages"
)

$files = @(
    "backend/config/database.js",
    "backend/config/config.js",
    "backend/models/User.js",
    "backend/models/Product.js",
    "backend/models/Cart.js",
    "backend/routes/auth.js",
    "backend/routes/products.js",
    "backend/routes/users.js",
    "backend/routes/cart.js",
    "backend/middleware/auth.js",
    "backend/middleware/validation.js",
    "backend/controllers/authController.js",
    "backend/controllers/productController.js",
    "backend/controllers/userController.js",
    "backend/controllers/cartController.js",
    "backend/utils/validator.js",
    "backend/utils/helpers.js",
    "backend/server.js",
    "backend/package.json",
    "frontend/public/index.html",
    "frontend/public/favicon.ico",
    "frontend/src/components/common/Header.js",
    "frontend/src/components/common/Footer.js",
    "frontend/src/components/common/Loading.js",
    "frontend/src/components/common/Modal.js",
    "frontend/src/components/auth/LoginForm.js",
    "frontend/src/components/auth/SignupForm.js",
    "frontend/src/components/products/ProductCard.js",
    "frontend/src/components/products/ProductList.js",
    "frontend/src/components/products/ProductDetail.js",
    "frontend/src/components/products/AddProduct.js",
    "frontend/src/components/user/Dashboard.js",
    "frontend/src/components/user/Profile.js",
    "frontend/src/components/user/MyListings.js",
    "frontend/src/components/cart/Cart.js",
    "frontend/src/components/cart/CartItem.js",
    "frontend/src/pages/Home.js",
    "frontend/src/pages/Login.js",
    "frontend/src/pages/Signup.js",
    "frontend/src/pages/ProductDetails.js",
    "frontend/src/pages/AddProduct.js",
    "frontend/src/pages/Dashboard.js",
    "frontend/src/pages/Cart.js",
    "frontend/src/pages/PreviousPurchases.js",
    "frontend/src/context/AuthContext.js",
    "frontend/src/context/CartContext.js",
    "frontend/src/services/api.js",
    "frontend/src/services/authService.js",
    "frontend/src/services/productService.js",
    "frontend/src/services/userService.js",
    "frontend/src/utils/constants.js",
    "frontend/src/utils/helpers.js",
    "frontend/src/utils/validation.js",
    "frontend/src/styles/globals.css",
    "frontend/src/App.js",
    "frontend/src/App.css",
    "frontend/src/index.js",
    "frontend/package.json",
    "frontend/.env",
    ".gitignore",
    "README.md",
    "docker-compose.yml"
)

# Create folders
foreach ($f in $folders) {
    if (-not (Test-Path $f)) {
        New-Item -ItemType Directory -Path $f -Force | Out-Null
        Write-Host "Created folder: $f"
    }
}

# Create empty files
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force | Out-Null
        Write-Host "Created file: $file"
    }
}

Write-Host "✅ EcoFinds structure created successfully!"
