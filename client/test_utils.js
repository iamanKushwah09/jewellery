const getImageUrl = (image) => {
  const uri = "http://localhost:5056/api";
  const baseUrl = uri.replace('/api', '');
  
  let rawImage = Array.isArray(image) ? image[0] : image;
  
  if (typeof rawImage === 'object' && rawImage !== null) {
      const extractedPath = rawImage.url || rawImage.path || rawImage.image_url;
      if (!extractedPath) {
          return 'https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png';
      }
      rawImage = extractedPath;
  }

  if (!rawImage || typeof rawImage !== 'string') {
    return 'https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png';
  }
  
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
    return rawImage;
  }
  
  return `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
};

console.log("String input:", getImageUrl("https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"));
console.log("Array input:", getImageUrl(["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"]));
console.log("Object input:", getImageUrl([{ url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80" }]));
console.log("Relative path input:", getImageUrl("/product-image.jpg"));
