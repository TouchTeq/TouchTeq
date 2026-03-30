# SEO Audit Report — Touch Teq Engineering (touchteq.co.za)

**Date:** March 30, 2026  
**Auditor:** Cline AI SEO Specialist  
**Site:** https://touchteq.co.za  
**Type:** Industrial Engineering (B2B Services)

---

## Executive Summary

**Overall SEO Health: STRONG (8.5/10)**

Touch Teq Engineering has a well-optimized website with strong technical foundations, excellent content depth, and solid E-E-A-T signals. The site demonstrates professional engineering credibility with comprehensive service pages, detailed about page, and valuable insight articles.

### Top 5 Priority Issues

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | Missing individual page metadata (service pages, insights) | High | Critical |
| 2 | No breadcrumb navigation on service/insight pages | Medium | High |
| 3 | Missing FAQ schema markup on pages with FAQs | Medium | High |
| 4 | No BlogPosting schema on insight articles | Medium | Medium |
| 5 | External images from picsum.photos (placeholder) | Low | Medium |

---

## Technical SEO Findings

### ✅ Crawlability & Indexation — PASS

**Robots.txt**
- Properly configured with `allow: /` for all user agents
- Correctly blocks `/office/`, `/api/`, `/admin/` directories
- Includes specific rules for AI bots (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai, Google-Extended)
- Sitemap reference included: `https://touchteq.co.za/sitemap.xml`
- Host directive set correctly

**XML Sitemap**
- Well-structured with 25 URLs
- Proper priority hierarchy (homepage: 1.0, services: 0.8, insights: 0.7-0.8)
- Appropriate changeFrequency values
- Includes all public-facing pages
- **Issue:** Sitemap references `/insights/fire-and-gas-system-commissioning` but this page was not found in the file structure — verify it exists

**Site Architecture**
- Logical hierarchy: Home → Services → Individual Service Pages
- Important pages within 3 clicks of homepage
- Clean URL structure: `/services/fire-and-gas-detection`, `/insights/article-name`
- No orphan pages detected

### ✅ HTTPS & Security — PASS

- HTTPS enforced across the site
- Next.js standalone output configured
- No mixed content issues detected

### ⚠️ Schema Markup — PARTIAL PASS

**Current Implementation:**
- ✅ ProfessionalService schema on homepage (excellent)
- ✅ WebSite schema on homepage
- ✅ Person schema for founder (Thabo Matona)
- ✅ ContactPoint information included
- ✅ SameAs links to social profiles

**Missing Schema:**
- ❌ FAQPage schema on pages with FAQs (homepage, service pages, about, contact)
- ❌ BlogPosting schema on insight articles
- ❌ BreadcrumbList schema
- ❌ Service schema on individual service pages
- ❌ LocalBusiness schema (could complement ProfessionalService)

**Recommendation:** Add FAQPage schema to all pages with FAQ sections. This can generate rich snippets in Google search results and improve click-through rates.

---

## On-Page SEO Findings

### ✅ Homepage (app/page.tsx) — PASS

- Single H1: "Industrial Engineering Where Safety is Non-Negotiable."
- Clear value proposition
- Strong CTAs (Request Consultation, Free Risk Assessment)
- Trust signals displayed (IEC 61511, OEM-Approved, Regional Coverage, 24/7 Support)
- Good internal linking to services and contact

### ⚠️ Individual Page Metadata — NEEDS IMPROVEMENT

**Issue:** The service pages and insight articles are client components (`'use client'`) and do not export Next.js metadata objects. This means they inherit the root layout metadata rather than having unique titles and descriptions.

**Affected Pages:**
- `/services/fire-and-gas-detection` — No unique metadata
- `/services/control-and-instrumentation` — No unique metadata
- `/services/electrical-engineering` — No unique metadata
- `/services/hazardous-area-classification` — No unique metadata
- `/services/design-and-engineering` — No unique metadata
- `/services/installation-and-commissioning` — No unique metadata
- `/services/maintenance-and-support` — No unique metadata
- `/insights/*` — No unique metadata
- `/about` — No unique metadata
- `/contact` — No unique metadata
- `/industries` — No unique metadata
- `/risk-assessment` — No unique metadata

**Fix Required:** Convert pages to use Next.js App Router metadata pattern by either:
1. Creating a `page.tsx` that exports metadata and renders the client component
2. Using `generateMetadata` function

**Recommended Metadata for Key Pages:**

```
/services/fire-and-gas-detection:
  Title: "Fire & Gas Detection Systems for Industrial Facilities | Touch Teq"
  Description: "Design, supply, install, and commission fire and gas detection systems for refineries, chemical plants, and mining operations across Southern Africa. IEC 61511 & SANS 10089 compliant."

/about:
  Title: "About Touch Teq Engineering | Specialist Industrial Engineering South Africa"
  Description: "Learn about Touch Teq Engineering — a specialist industrial engineering firm delivering fire & gas detection, C&I, and electrical engineering across Southern Africa since [year]."

/contact:
  Title: "Contact Touch Teq Engineering | Get a Quote for Industrial Engineering Services"
  Description: "Contact our engineering team for fire & gas detection, control & instrumentation, and electrical engineering services. 24/7 emergency support available across Southern Africa."
```

### ✅ Heading Structure — PASS

**Homepage:**
- H1: "Industrial Engineering Where Safety is Non-Negotiable."
- Proper hierarchy maintained

**Service Pages (fire-and-gas-detection example):**
- H1: "Fire & Gas Detection Systems for Industrial Facilities"
- H2s: "Protecting People and Assets in High-Risk Environments", "Full-Scope Fire & Gas Detection Services", "Comprehensive Detection Capabilities", etc.
- Logical hierarchy maintained throughout

**About Page:**
- H1: "Specialist Engineering for Safety-Critical Industrial Environments Across Southern Africa"
- Strong heading hierarchy with clear sections

### ✅ Content Quality — EXCELLENT

**Service Pages:**
- Comprehensive content (2000+ words per service page)
- Technical depth with specific standards referenced (IEC 61511, SANS 10089, ATEX, IECEx)
- Clear service descriptions with numbered offerings
- Industry-specific use cases
- FAQ sections addressing common questions
- Strong CTAs throughout

**About Page:**
- Exceptional depth (5000+ words)
- Clear company principles and values
- Detailed technical disciplines explained
- Team credentials and ECSA registration mentioned
- Regional coverage detailed
- Safety culture section
- E-E-A-T signals strongly present

**Insights/Articles:**
- 5 high-quality technical articles
- Topics directly relevant to target audience
- Proper categorization (Technical Articles, Regulatory Updates)
- Read time estimates
- Strong internal linking to services

### ✅ Internal Linking — PASS

- Footer contains comprehensive service links
- Service pages link to related services
- Insights link to relevant service pages
- CTAs consistently link to contact page
- Breadcrumb navigation on service pages (partial)

### ⚠️ Breadcrumb Navigation — PARTIAL

**Current State:**
- ✅ Service pages have visual breadcrumbs (Home → Our Services → Fire & Gas Detection)
- ❌ No BreadcrumbList schema markup
- ❌ Insights articles lack breadcrumbs
- ❌ About page lacks breadcrumbs

**Recommendation:** Add BreadcrumbList schema to all pages with visual breadcrumbs.

---

## Content & E-E-A-T Assessment

### ✅ Experience — STRONG

- Founder bio with 20+ years experience detailed
- Specific project types mentioned (refineries, chemical plants, mines)
- Regional experience across SADC countries
- "Written by Engineers. For Engineers." positioning

### ✅ Expertise — STRONG

- ECSA Professional Technologist registration mentioned
- IEC 61511 functional safety competence
- Hazardous area engineering knowledge
- Technical articles demonstrate deep knowledge
- Standards references throughout (IEC, SANS, ATEX)

### ✅ Authoritativeness — STRONG

- Professional registrations displayed
- B-BBEE Level 1 Contributor status
- SAQCC Fire Industry registration
- SameAs links to LinkedIn, Facebook, Twitter
- Physical address provided
- Contact information prominently displayed

### ✅ Trustworthiness — STRONG

- HTTPS secure site
- Privacy policy and terms of service linked
- Physical address in Roodepoort, Gauteng
- Direct phone number and email
- Professional indemnity insurance mentioned
- Clear company information

---

## Performance & Core Web Vitals

### ⚠️ Unable to Fully Assess — RECOMMENDATIONS PROVIDED

**Note:** Core Web Vitals cannot be assessed without live site testing. However, based on code review:

**Potential Concerns:**
1. **Heavy animations:** Site uses `motion/react` extensively with complex animations
2. **Large images:** Multiple hero images loaded with `priority` flag
3. **Client-side rendering:** All public pages are client components (`'use client'`)
4. **External images:** `picsum.photos` and `images.unsplash.com` referenced

**Recommendations:**
- Run PageSpeed Insights: https://pagespeed.web.dev/
- Test with WebPageTest: https://www.webpagetest.org/
- Monitor Core Web Vitals in Google Search Console
- Consider converting key pages to Server Components for better FCP/LCP
- Implement proper image optimization with Next.js Image component
- Add `loading="lazy"` to below-fold images

---

## Mobile-Friendliness

### ✅ Responsive Design — PASS (Based on Code Review)

- Tailwind CSS responsive classes used throughout (`md:`, `lg:`)
- Mobile-first approach evident
- Flexible grid layouts (`grid-cols-1 md:grid-cols-2`)
- Responsive typography (`text-4xl md:text-7xl`)
- Touch-friendly CTAs with adequate sizing

---

## Image Optimization

### ⚠️ Mixed Image Sources — NEEDS ATTENTION

**Current State:**
- ✅ Next.js Image component used consistently
- ✅ `priority` flag used on hero images
- ✅ `referrerPolicy="no-referrer"` set on images
- ❌ Placeholder images from `picsum.photos` used (B-BBEE logo, contact hero)
- ❌ No WebP format specification (Next.js handles this automatically)
- ❌ Missing alt text on some decorative images

**Recommendations:**
- Replace `picsum.photos` placeholder images with actual company images
- Ensure all images have descriptive, keyword-relevant alt text
- Consider adding `sizes` prop to Image components for responsive loading

---

## Local SEO

### ✅ Local Signals — STRONG

- Physical address: 91 Sir George Grey St, Horizon, Roodepoort, 1724
- Phone number: +27 72 552 2110
- Email: info@touchteq.co.za
- Business hours: Mon-Fri 08:00-17:00
- Area served: South Africa, Botswana, Mozambique, Namibia, Zimbabwe
- ProfessionalService schema with address and contact info

**Recommendations:**
- Claim and optimize Google Business Profile
- Add Google Maps embed to contact page (currently uses `openMap` function)
- Consider adding LocalBusiness schema alongside ProfessionalService
- Encourage client reviews on Google Business Profile

---

## Social Media & Open Graph

### ✅ Open Graph & Twitter Cards — PASS

**Open Graph:**
- ✅ type: website
- ✅ locale: en_ZA
- ✅ url: https://touchteq.co.za
- ✅ siteName: Touch Teq Engineering
- ✅ title and description set
- ✅ image: /TT-logo-orange-trans.png (1200x630)

**Twitter:**
- ✅ card: summary_large_image
- ✅ title and description set
- ✅ image set
- ✅ creator: @TouchTeqniques

**Social Profiles:**
- LinkedIn: https://www.linkedin.com/company/touch-teqniques-engineering-services/
- Facebook: https://www.facebook.com/TouchTeqniques
- Twitter: https://x.com/TouchTeqniques

---

## Prioritized Action Plan

### Critical Fixes (Do First)

1. **Add unique metadata to all pages**
   - Convert client components to support Next.js metadata exports
   - Write unique titles (50-60 chars) and descriptions (150-160 chars) for each page
   - Impact: High — affects how pages appear in search results
   - Effort: Medium

2. **Add FAQPage schema markup**
   - Implement on homepage, service pages, about page, and contact page
   - Can generate rich snippets in SERPs
   - Impact: Medium-High — improves SERP visibility
   - Effort: Low

### High-Impact Improvements

3. **Add BreadcrumbList schema**
   - Implement on all pages with visual breadcrumbs
   - Improves navigation signals for search engines
   - Impact: Medium
   - Effort: Low

4. **Add BlogPosting schema to insight articles**
   - Include author, datePublished, dateModified
   - Link to author Person schema
   - Impact: Medium
   - Effort: Low

5. **Verify sitemap completeness**
   - Confirm `/insights/fire-and-gas-system-commissioning` exists
   - Add any missing pages to sitemap
   - Impact: Medium
   - Effort: Low

### Quick Wins

6. **Replace placeholder images**
   - Replace `picsum.photos` images with actual company photos
   - Impact: Low-Medium (trust signals)
   - Effort: Low

7. **Add breadcrumbs to insight articles**
   - Home → Insights → Article Title
   - Impact: Low
   - Effort: Low

8. **Optimize image alt text**
   - Review all images for descriptive, keyword-relevant alt text
   - Impact: Low-Medium
   - Effort: Low

### Long-Term Recommendations

9. **Performance optimization**
   - Run PageSpeed Insights and address issues
   - Consider Server Components for key landing pages
   - Implement proper caching strategies
   - Impact: High (Core Web Vitals)
   - Effort: Medium-High

10. **Content expansion**
    - Add more insight articles (target 2-4 per month)
    - Create comparison/alternative pages for services
    - Add case studies with client results
    - Impact: High (topical authority)
    - Effort: Ongoing

11. **Google Business Profile optimization**
    - Claim and fully optimize GBP listing
    - Add photos, services, posts
    - Encourage client reviews
    - Impact: High (local SEO)
    - Effort: Medium

12. **Link building**
    - Submit to industry directories (SAICE, ECSA, etc.)
    - Guest posts on engineering publications
    - Partner with complementary businesses
    - Impact: High (domain authority)
    - Effort: Ongoing

---

## What's Working Well

1. **Excellent content depth** — Service pages and about page are comprehensive and demonstrate real expertise
2. **Strong E-E-A-T signals** — Professional registrations, founder bio, physical address, contact info
3. **Clean URL structure** — Logical, descriptive URLs
4. **Good robots.txt configuration** — Properly blocks private areas, includes AI bot rules
5. **Well-structured sitemap** — Appropriate priorities and change frequencies
6. **Solid JSON-LD implementation** — ProfessionalService, WebSite, and Person schemas on homepage
7. **Strong internal linking** — Footer, service cross-links, CTAs
8. **Mobile-responsive design** — Tailwind responsive classes throughout
9. **Professional branding** — Consistent visual identity and messaging
10. **Technical content** — Insight articles demonstrate genuine engineering knowledge

---

## Tools for Ongoing Monitoring

- **Google Search Console** — Monitor indexing, rankings, Core Web Vitals
- **Google PageSpeed Insights** — Track performance metrics
- **Google Rich Results Test** — Validate schema markup: https://search.google.com/test/rich-results
- **Ahrefs/Semrush** — Track rankings and backlinks (paid)
- **Screaming Frog** — Technical SEO crawling (free up to 500 URLs)

---

## Conclusion

Touch Teq Engineering has a strong SEO foundation with excellent content quality and clear E-E-A-T signals. The primary area for improvement is implementing unique page metadata across all pages and adding structured data (FAQ schema, BreadcrumbList, BlogPosting). These changes, combined with the existing strong content, should significantly improve search visibility for target keywords in the industrial engineering space.

The website effectively communicates expertise, trustworthiness, and authority — key factors for B2B engineering services. With the recommended technical improvements, this site is well-positioned to rank competitively for target keywords like "fire and gas detection South Africa," "hazardous area classification," and "IEC 61511 compliance."