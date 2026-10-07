# leadiq-ai-product
AI-powered B2B lead intelligence and prioritization platform
# LeadIQ — AI-Powered B2B Lead Intelligence & Conversion Platform

LeadIQ is an AI/ML-powered B2B lead prioritization platform designed to help marketplace sellers identify which buyer inquiries deserve attention first.

The core idea is simple:

> **Instead of treating every incoming inquiry equally, LeadIQ ranks leads by their predicted conversion potential and tells sellers what to do next.**

---

## 🚀 Product Overview

B2B sellers often receive a large number of buyer inquiries but have limited time and sales capacity.

LeadIQ addresses this problem through an intelligent workflow:

**Incoming Lead → ML Scoring → Priority Ranking → AI Explanation → Recommended Action → Seller Response**

The platform helps sellers answer:

> **"Which buyer inquiry should I prioritize right now?"**

---

## 🎯 Key Features

### 1. AI Priority Inbox

Ranks incoming inquiries based on their predicted conversion potential.

Each lead receives:

- **AI Priority Score** — relative priority of the lead compared with other incoming inquiries
- **Predicted Conversion Probability** — estimated probability of conversion
- **Priority Tier** — High, Medium, or Low
- **Recommended Action**

### 2. Lead Intelligence

The platform combines buyer, inquiry, and seller signals such as:

- Buyer industry
- Buyer location
- Company size
- Previous orders
- Previous inquiries
- Repeat buyer status
- Product category
- Inquiry value
- Quantity
- Urgency
- Lead source
- Seller rating
- Seller experience
- Historical conversion rate
- Buyer-seller interaction history

### 3. Explainable Prioritization

LeadIQ doesn't only rank leads.

It also provides reasons behind the recommendation, such as:

- Critical urgency
- Repeat buyer
- Previous purchase history
- Large/Enterprise buyer
- High inquiry value
- Large quantity

This makes the recommendation easier for sellers to understand and act upon.

### 4. Recommended Next Action

Each lead receives a suggested response priority, for example:

- Respond within 15 minutes
- Respond within 30 minutes
- Respond within 1 hour
- Respond within 2 hours
- Handle after higher-priority leads

### 5. AI Response Assistant

The product prototype generates a seller response using contextual information from the inquiry, including:

- Product
- Quantity
- Inquiry value
- Urgency
- Buyer requirement

---

## 🤖 Machine Learning Approach

LeadIQ uses a supervised classification model to estimate the probability that an inquiry will convert.

### Final Model

**Histogram-based Gradient Boosting Classifier**

The model was selected after comparing multiple approaches and prioritizing ranking performance and generalization rather than simply maximizing training performance.

### Validation Strategy

A **temporal train-validation-test split** was used to better represent how the model would perform on future incoming leads.

| Dataset | Rows | Conversion Rate |
|---|---:|---:|
| Training | 14,000 | 17.39% |
| Validation | 3,000 | 21.63% |
| Test | 3,000 | 22.33% |

The future test period was kept untouched during model selection.

---

## 📊 Model Performance

The primary product objective is **lead ranking**, rather than classification accuracy alone.

On the untouched temporal test set:

| Metric | Result |
|---|---:|
| ROC-AUC | **0.653** |
| Precision @ Top 10% | **39.67%** |
| Lift @ Top 10% | **1.78×** |
| Overall Conversion Rate | **22.33%** |

### What does 1.78× lift mean?

The top 10% of leads ranked by LeadIQ had a conversion rate approximately **1.78 times the overall conversion rate** in the temporal test set.

This supports the product's core use case:

> **Help sellers focus their limited response capacity on higher-potential inquiries.**

---

## 🧠 Priority Score vs Conversion Probability

LeadIQ deliberately separates these two concepts.

### AI Priority Score

A **0–100 relative score** representing how strongly LeadIQ recommends prioritizing a lead compared with other incoming inquiries.

### Predicted Conversion Probability

The ML model's estimated probability that the inquiry converts.

For example:

**AI Priority Score:** 92.9 / 100  
**Predicted Conversion Probability:** 41.87%

The Priority Score is **not** a 92.9% probability of conversion.

---

## 🧪 Product Experiment

LeadIQ proposes an A/B experiment to measure whether AI-based prioritization improves seller outcomes.

### Control

Leads displayed using the existing/default ordering.

### Treatment

Leads ranked using LeadIQ's AI Priority Score.

### Primary Metric

**Lead-to-order conversion rate**

### Secondary Metrics

- Response time
- Response rate
- Qualified lead rate
- GMV

The experiment is proposed as part of the product design and is not presented as an actual production uplift.

---

## 🖥️ Product Experience

The prototype contains:

### Overview

A seller dashboard showing:

- Incoming leads
- Leads requiring attention
- Opportunity value
- Top-decile model lift
- Highest-priority inquiries

### Priority Inbox

A filterable lead queue with:

- Priority
- Urgency
- Product category
- Search

### Lead Detail

Provides:

- AI Priority Score
- Conversion probability
- Buyer information
- Requirement details
- Buyer history
- Seller profile
- Why the lead was prioritized
- Recommended action
- AI Response Assistant

---

## 🏗️ Architecture

```text
                    Incoming Buyer Inquiry
                              │
                              ▼
                    ┌─────────────────┐
                    │ Feature         │
                    │ Enrichment      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ ML Conversion   │
                    │ Model           │
                    └────────┬────────┘
                             │
                             ▼
                  Conversion Probability
                             │
                             ▼
                    ┌─────────────────┐
                    │ Priority        │
                    │ Ranking         │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          Lead Explanation        Recommended Action
                 │                       │
                 └───────────┬───────────┘
                             ▼
                     Seller Priority
                        Inbox
                             │
                             ▼
                    AI Response Assistant
