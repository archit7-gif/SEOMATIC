# 🚀 SEO Backlink Platform - Postman Testing Endpoints

## Base URL
```
http://localhost:5000/api
```

## Environment Variables
Create these variables in Postman:
- `base_url`: http://localhost:5000/api
- `token`: (will be auto-set after login)
- `projectId`: (set after creating project)
- `contentId`: (set after content generation)
- `siteId`: (set after creating site)

---

## 📌 1. AUTHENTICATION

### 1.1 Register
```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### 1.2 Login
```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

// Save token from response:
pm.environment.set("token", pm.response.json().data.tokens.accessToken);
```

### 1.3 Get Current User
```
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```

### 1.4 Forgot Password
```
POST {{base_url}}/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

---

## 📌 2. PROJECTS

### 2.1 Create Project
```
POST {{base_url}}/projects
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "My SEO Project",
  "description": "Test project for SEO backlinks",
  "contentRules": {
    "keywordsPerArticle": 3,
    "contentMood": "informative",
    "wordsPerParagraph": 100,
    "titleLength": "medium",
    "language": "english",
    "includeConclusion": true,
    "contentSource": "mixed",
    "formatting": {
      "useBulletPoints": true,
      "useEmojis": false
    }
  }
}

// Save projectId:
pm.environment.set("projectId", pm.response.json().data.project.id);
```

### 2.2 Get All Projects
```
GET {{base_url}}/projects?page=1&limit=10
Authorization: Bearer {{token}}
```

### 2.3 Get Single Project
```
GET {{base_url}}/projects/{{projectId}}
Authorization: Bearer {{token}}
```

### 2.4 Update Project
```
PUT {{base_url}}/projects/{{projectId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

### 2.5 ✅ Upload Project Form Excel
```
POST {{base_url}}/projects/{{projectId}}/upload-form
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

file: [Select Excel File]
```

### 2.6 ✅ Get Project Form
```
GET {{base_url}}/projects/{{projectId}}/form
Authorization: Bearer {{token}}
```

### 2.7 ✅ Update Project Form
```
PUT {{base_url}}/projects/{{projectId}}/form
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "projectForm": {
    "basics": {
      "email": "business@example.com",
      "website": "https://example.com",
      "category": "Technology",
      "phone": "+1234567890"
    },
    "business": {
      "businessName": "Example Business",
      "tagline": "Your tagline here",
      "description": "Business description"
    },
    "social": {
      "facebook": "https://facebook.com/example",
      "twitter": "https://twitter.com/example"
    },
    "tags": {
      "mode": "manual",
      "tags": ["seo", "marketing", "digital"]
    }
  }
}
```

### 2.8 Update Content Rules
```
PUT {{base_url}}/projects/{{projectId}}/rules
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "contentRules": {
    "keywordsPerArticle": 5,
    "contentMood": "promotional",
    "language": "english"
  }
}
```

### 2.9 Get Project Stats
```
GET {{base_url}}/projects/{{projectId}}/stats
Authorization: Bearer {{token}}
```

---

## 📌 3. CONTENT GENERATION

### 3.1 Upload Content Excel
```
POST {{base_url}}/content/upload
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

projectId: {{projectId}}
file: [Select Excel File]
```

### 3.2 Generate Content
```
POST {{base_url}}/content/generate
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "projectId": "{{projectId}}"
}
```

### 3.3 Get Content by Project
```
GET {{base_url}}/projects/{{projectId}}/content?page=1&limit=20
Authorization: Bearer {{token}}
```

### 3.4 Get Single Content Item
```
GET {{base_url}}/content/{{contentId}}
Authorization: Bearer {{token}}
```

### 3.5 Get Content by Task Type
```
GET {{base_url}}/content/by-task/{{projectId}}/classified
Authorization: Bearer {{token}}
```

### 3.6 Download Generated Content
```
GET {{base_url}}/content/download/{{projectId}}
Authorization: Bearer {{token}}
```

---

## 📌 4. POSTING SITES

### 4.1 Create Site (Admin)
```
POST {{base_url}}/sites
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Example Classified Site",
  "url": "https://exampleclassified.com",
  "category": "classified",
  "credentials": {
    "username": "admin",
    "password": "password"
  },
  "requiredFields": ["title", "description", "email"]
}

// Save siteId:
pm.environment.set("siteId", pm.response.json().data.site._id);
```

### 4.2 Get All Sites
```
GET {{base_url}}/sites
Authorization: Bearer {{token}}
```

### 4.3 Get Sites by Category
```
GET {{base_url}}/sites/category/classified
Authorization: Bearer {{token}}
```

### 4.4 Update Site
```
PUT {{base_url}}/sites/{{siteId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Updated Site Name",
  "isActive": true
}
```

---

## 📌 5. ✅ AUTO POSTING (NEW)

### 5.1 ✅ Smart Select
```
GET {{base_url}}/auto-posting/smart-select/{{projectId}}
Authorization: Bearer {{token}}
```

### 5.2 ✅ Auto Publish Project
```
POST {{base_url}}/auto-posting/auto-publish
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "projectId": "{{projectId}}",
  "options": {
    "maxSitesPerContent": 5,
    "delayBetweenPosts": 2000,
    "retryFailed": true
  }
}
```

### 5.3 ✅ Publish to Selected Sites
```
POST {{base_url}}/auto-posting/publish-selected
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "contentIds": ["contentId1", "contentId2"],
  "siteIds": ["siteId1", "siteId2"]
}
```

### 5.4 ✅ Get Publishing Stats
```
GET {{base_url}}/auto-posting/stats/{{projectId}}
Authorization: Bearer {{token}}
```

### 5.5 ✅ Get Publishing Results
```
GET {{base_url}}/auto-posting/results/{{projectId}}?page=1&limit=20
Authorization: Bearer {{token}}
```

### 5.6 ✅ Get Successful Backlinks
```
GET {{base_url}}/auto-posting/backlinks/{{projectId}}
Authorization: Bearer {{token}}
```

### 5.7 ✅ Retry Failed Publications
```
POST {{base_url}}/auto-posting/retry
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "projectId": "{{projectId}}"
}
```

---

## 📌 6. ✅ CATEGORIES (NEW)

### 6.1 ✅ Create Category (Admin)
```
POST {{base_url}}/categories
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Technology",
  "description": "Tech related categories",
  "taskTypes": ["classified", "guest_posting"],
  "parent": null
}
```

### 6.2 ✅ Get All Categories
```
GET {{base_url}}/categories
Authorization: Bearer {{token}}
```

### 6.3 ✅ Get Category Tree
```
GET {{base_url}}/categories/tree
Authorization: Bearer {{token}}
```

### 6.4 ✅ Get Popular Categories
```
GET {{base_url}}/categories/popular?limit=10
Authorization: Bearer {{token}}
```

### 6.5 ✅ Get Categories by Task Type
```
GET {{base_url}}/categories/by-task/classified
Authorization: Bearer {{token}}
```

---

## 📌 7. ✅ IMAGE POOL (NEW)

### 7.1 ✅ Upload Images
```
POST {{base_url}}/image-pool/upload
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

images: [Select Multiple Images]
projectId: {{projectId}}
imageType: pool
tags: seo,marketing,business
```

### 7.2 ✅ Get All Images
```
GET {{base_url}}/image-pool?page=1&limit=20&imageType=pool
Authorization: Bearer {{token}}
```

### 7.3 ✅ Get Random Images
```
GET {{base_url}}/image-pool/random?count=5&imageType=pool
Authorization: Bearer {{token}}
```

### 7.4 ✅ Get Project Images
```
GET {{base_url}}/image-pool/project/{{projectId}}?imageType=homepage
Authorization: Bearer {{token}}
```

### 7.5 ✅ Get Image Stats
```
GET {{base_url}}/image-pool/stats
Authorization: Bearer {{token}}
```

### 7.6 ✅ Update Image
```
PUT {{base_url}}/image-pool/{{imageId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "imageType": "logo",
  "tags": "brand,logo,company",
  "isActive": true
}
```

### 7.7 ✅ Delete Image
```
DELETE {{base_url}}/image-pool/{{imageId}}
Authorization: Bearer {{token}}
```

### 7.8 ✅ Bulk Delete Images
```
POST {{base_url}}/image-pool/bulk-delete
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "imageIds": ["imageId1", "imageId2", "imageId3"]
}
```

---

## 📌 8. REPORTS

### 8.1 Generate Report
```
GET {{base_url}}/reports/{{projectId}}
Authorization: Bearer {{token}}
```

### 8.2 Get Report Summary
```
GET {{base_url}}/reports/summary/{{projectId}}
Authorization: Bearer {{token}}
```

### 8.3 Get All Backlinks
```
GET {{base_url}}/reports/backlinks/{{projectId}}
Authorization: Bearer {{token}}
```

---

## 📝 Sample Excel Format for Content Upload

### Content Excel Columns:
```
| title | description | keyword | target_link | task_type | word_limit |
|-------|-------------|---------|-------------|-----------|------------|
| Best SEO Tools | Top SEO tools for 2024 | seo tools | https://example.com | classified | 200 |
```

### Project Form Excel Columns:
```
| email | website | category | phone | facebook | twitter | business_name | tags |
|-------|---------|----------|-------|----------|---------|---------------|------|
| test@example.com | https://example.com | Tech | +123 | fb.com/test | twitter.com/test | My Business | seo,marketing |
```

---

## 🔧 Testing Workflow

### Complete Flow:
1. **Register/Login** → Get token
2. **Create Project** → Get projectId
3. **Upload Project Form** → Auto-fill business details
4. **Upload Content Excel** → Content data
5. **Generate Content** → AI creates content
6. **Create Sites** (Admin) → Add posting sites
7. **Smart Select** → See matched sites
8. **Auto Publish** → Publish content
9. **Get Results** → Check backlinks
10. **Download Report** → Final Excel report

---

## 🎯 Quick Test Script

```javascript
// 1. Register & Login
pm.sendRequest({
  url: pm.environment.get("base_url") + "/auth/login",
  method: "POST",
  header: { "Content-Type": "application/json" },
  body: {
    mode: "raw",
    raw: JSON.stringify({
      email: "test@example.com",
      password: "password123"
    })
  }
}, (err, res) => {
  pm.environment.set("token", res.json().data.tokens.accessToken);
});

// 2. Create Project
// 3. Upload Excel
// 4. Generate Content
// 5. Auto Publish
```

---

## ✅ Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 🚨 Important Notes

1. **Authentication**: All endpoints (except auth) require Bearer token
2. **File Uploads**: Use `multipart/form-data` for Excel/Image uploads
3. **Pagination**: Most list endpoints support `?page=1&limit=20`
4. **Rate Limiting**: Max 100 requests per 15 minutes per IP
5. **File Size Limits**: 
   - Excel: 10MB
   - Images: 5MB per image, max 10 at once

---

## 📊 Testing Priority Order

1. ✅ Auth (Register, Login)
2. ✅ Projects (Create, Get)
3. ✅ Project Form (Upload, Get)
4. ✅ Content Upload & Generation
5. ✅ Sites Management
6. ✅ Categories (Create, Get)
7. ✅ Image Pool (Upload, Get Random)
8. ✅ Smart Select
9. ✅ Auto Publishing
10. ✅ Results & Reports
