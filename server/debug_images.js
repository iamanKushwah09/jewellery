
# Server Configuration
PORT=5056

# Database Configuration
MONGO_URI=mongodb://localhost:27017/jewellery

# JWT Configuration
JWT_SECRET=futl3rifraso2evLbaTls4icrOnespuv1yutu
JWT_SECRET_FOR_VERIFY=sAfENaxemapePrAQO42
JWT_EXPIRES_IN=24h

STRIPE_KEY=p12mlbEsWEv5ph
MAX_AMOUNT=5000.0
MIN_AMOUNT =10.0
AMOUNT_STEP =5.0
CURRENCY=usd
STRIPE_PAYMENT_DESCRIPTION="This is Vellora Jewels payment with Stripe!"

# if you want to use gmail/email sent for email verfication or forget password then bellow .env file 
# need to configure otherwise no need to configure. As per the google they not recomaned to use app password 
# https://support.google.com/accounts/answer/185833?hl=en, so you can use paid smpt service or use current next auth.

SERVICE=gmail
EMAIL_USER=xpskool@gmail.com
EMAIL_PASS=nxquhvxojbgzqsrc
HOST=smtp.gmail.com
EMAIL_PORT=465

# //when in production mode use this
# STORE_URL=https://www.vellorajewels.com
# ADMIN_URL=https://admin.vellorajewels.com
# BASE_URL=https://api.vellorajewels.com
BASE_URL=http://localhost:5056
FILE_UPLOAD_FOLDER=../uploadFile
# BUSY_API=https://busyapi.vellorajewels.com
NODE_ENV=development
#NODE_ENV=production


CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


RAZORPAY_KEY_ID=rzp_test_T79eOBt7xZ23BF
RAZORPAY_KEY_SECRET=FDyq1MMUWQXrEgVwOUBanglV

# RAZORPAY_KEY_ID=rzp_test_T79eOBt7xZ23BF
# RAZORPAY_KEY_SECRET=FDyq1MMUWQXrEgVwOUBanglV

