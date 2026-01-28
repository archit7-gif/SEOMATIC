

# 🧪 SEO Backlink Backend – **Testing Plan**





## 🔧 Prerequisites (One-time Setup)

1. Backend running:

```bash
npm install
cp .env.example .env
npm run dev
```

2. Base URL (used in all requests):

```
http://localhost:5000
```

3. In Postman:

* Create a **Collection** → `SEO Backlink Testing`
* Create an **Environment** → `Local`
* Add variables:

  * `baseUrl` = `http://localhost:5000`
  * `token` = (empty)
  * `projectId` = (empty)

---

## STEP 1️⃣ Authentication

### 1. Register User

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/register`
**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123"
}
```

✅ **Expected:** User created successfully

---

### 2. Login User

**Method:** `POST`
**URL:** `{{baseUrl}}/api/auth/login`
**Body (JSON):**

```json
{
  "email": "test@example.com",
  "password": "test123"
}
```

✅ **Expected:**

* `accessToken` returned

📌 **Action (Important):**

* Copy `data.tokens.accessToken`
* Save it in environment variable → `token`

---

### 3. Verify Token

**Method:** `GET`
**URL:** `{{baseUrl}}/api/auth/me`
**Headers:**

```
Authorization: Bearer {{token}}
```

✅ **Expected:** Logged-in user profile returned

---

## STEP 2️⃣ Create Posting Sites

You must create **at least one site per category**.

---

### Create Site – Guest Posting

**POST** `{{baseUrl}}/api/sites`

```json
{
  "name": "Medium",
  "url": "https://medium.com",
  "category": "guest_posting"
}
```

---

### Create Site – Profile

```json
{
  "name": "LinkedIn",
  "url": "https://linkedin.com",
  "category": "profile"
}
```

---

### Create Site – Classified

```json
{
  "name": "Craigslist",
  "url": "https://craigslist.org",
  "category": "classified"
}
```

(Authorization header required in all)

✅ **Expected:** 3 sites created

---

### Verify Sites

**GET** `{{baseUrl}}/api/sites`

✅ **Expected:**
`count = 3`

---

## STEP 3️⃣ Create Project

**POST** `{{baseUrl}}/api/projects`

```json
{
  "name": "SEO Campaign Test",
  "contentRules": {
    "contentMood": "informational",
    "language": "english",
    "keywordsPerArticle": 3
  }
}
```

✅ **Expected:**

* Project created
* Copy `data.project.id`
* Save as `projectId` in environment

---

## STEP 4️⃣ Upload Excel / CSV File

### Test CSV File (Create Locally)

```csv
title,description,keyword,target_link,task_type,word_limit
Best SEO Tools 2026,Complete guide to SEO tools,SEO tools,https://example.com/seo,guest_posting,600
Expert Web Developer,Experienced full-stack developer,web developer,https://example.com/dev,profile,300
Laptop For Sale,High quality gaming laptop,gaming laptop,https://example.com/laptop,classified,200
```

---

### Upload File

**POST** `{{baseUrl}}/api/content/upload`

**Body → form-data**

* `file` → select CSV file
* `projectId` → `{{projectId}}`

✅ **Expected:**
`rowCount = 3`

---

## STEP 5️⃣ Generate Content

**POST** `{{baseUrl}}/api/content/generate`

```json
{
  "projectId": "{{projectId}}"
}
```

⏳ Wait **30 seconds**

---

### Verify Generation

**GET** `{{baseUrl}}/api/projects/{{projectId}}/stats`

✅ **Expected:**
`generatedItems = 3`

---

## STEP 6️⃣ Auto-Publish Content

**POST** `{{baseUrl}}/api/posting/auto-publish`

```json
{
  "projectId": "{{projectId}}"
}
```

⏳ Wait **20 seconds**

---

### Verify Publishing

**GET** `{{baseUrl}}/api/posting/results/{{projectId}}`

✅ **Expected:**
Multiple publish records returned

---

## STEP 7️⃣ Statistics & Summary

### Publish Stats

**GET** `{{baseUrl}}/api/posting/stats/{{projectId}}`

✅ **Expected:**
Success / failed counts visible

---

### Report Summary

**GET** `{{baseUrl}}/api/reports/summary/{{projectId}}`

✅ **Expected:**
Overall project summary returned

---

## STEP 8️⃣ Download Report

**GET** `{{baseUrl}}/api/reports/{{projectId}}`

📥 **Postman Action:**
Click **Save Response → Save to File**

✅ **Expected:**
Excel report downloaded

---

## STEP 9️⃣ Get Backlinks

**GET** `{{baseUrl}}/api/reports/backlinks/{{projectId}}`

✅ **Expected:**
Array of backlink URLs

---

## ✅ Final Verification Checklist

* [ ] Token stored correctly
* [ ] Sites created (3 categories)
* [ ] Project ID saved
* [ ] CSV uploaded (3 rows)
* [ ] Content generated
* [ ] Auto-publish executed
* [ ] Stats visible
* [ ] Report downloaded
* [ ] Backlinks returned


