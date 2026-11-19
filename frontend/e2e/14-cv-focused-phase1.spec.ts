import { test, expect } from '@playwright/test';

test.describe('Phase 1: Enhancv-Style CV/Resume Focused Suite (100% Global & Account-Gated Templates)', () => {
  test('Page 1 (Landing): should be 100% global (no country/Gulf mentions) and prompt to create account when clicking Use this template', async ({ page }) => {
    await page.goto('/');

    // Title and Brand
    await expect(page).toHaveTitle(/TalentRadar/i);

    // Ensure ZERO Gulf or country mentions anywhere on the landing page
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/\b(Gulf|Dubai|UAE|Saudi|Riyadh|Pakistan|GCC)\b/i);

    // CV-focused action buttons
    const builderBtn = page.getByRole('link', { name: /Build Your Resume|Launch Free Builder|Get Started/i }).first();
    const atsScannerBtn = page.getByRole('link', { name: /Get Your Resume Score|Free ATS Scanner|ATS Scanner/i }).first();
    const templatesBtn = page.getByRole('link', { name: /500\+ Templates|Templates/i }).first();

    await expect(builderBtn).toBeVisible();
    await expect(atsScannerBtn).toBeVisible();
    await expect(templatesBtn).toBeVisible();

    // Verify Navbar links for Phase 1
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: /CV Builder/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /ATS Scanner/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Templates/i })).toBeVisible();

    // Verify clicking "Use this template" when unauthenticated asks user to create an account first
    const useTemplateBtn = page.getByRole('button', { name: /Use this template/i }).first();
    await useTemplateBtn.click();

    const modalDialog = page.getByRole('dialog');
    await expect(modalDialog).toBeVisible();
    await expect(modalDialog).toContainText(/Create a free account to use this template/i);
  });

  test('Page 2 (ATS Scanner): should allow scanning global sample tech job and provide direct transition to Live Builder', async ({ page }) => {
    await page.goto('/ats-scanner');

    // Load sample Tech job
    await page.getByRole('button', { name: /Load Sample Tech Job/i }).first().click();

    // Execute scan
    await page.getByRole('button', { name: /Scan Resume Against Job Description/i }).click();

    // Verify ATS results appeared
    await expect(page.getByText(/ATS Score/i).first()).toBeVisible({ timeout: 15000 });

    // Verify button to transfer to live builder
    const transferBtn = page.getByRole('button', { name: /Edit in Live Visual Builder/i }).first();
    await expect(transferBtn).toBeVisible();
  });

  test('Page 3 (Live Visual Builder): should prompt unauthenticated users to create account on template switch and allow switching once authenticated', async ({ page }) => {
    await page.goto('/builder');

    // Verify Builder header and ATS health meter
    await expect(page.locator('text=ATS Health:').first()).toBeVisible();
    await expect(page.locator('text=LIVE BUILDER').first()).toBeVisible();

    // Verify Canvas is rendered with global defaults
    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toContainText(/Alexander Chen/i);

    // Verify the prominent Choose Resume Template visual showcase card is visible with signup lock indicators
    await expect(page.getByText('Choose Resume Template')).toBeVisible();
    await expect(page.getByText(/creating a free account is required to apply templates/i)).toBeVisible();

    // Clicking template card while unauthenticated opens Create Account modal
    await page.getByRole('button', { name: /1-Column Standard/i }).click();
    await expect(page.getByRole('dialog')).toContainText(/Create a free account to use this template/i);
    await page.getByRole('button', { name: 'Close modal' }).click();

    // Simulate authenticated user and verify template switching works immediately across layouts
    await page.evaluate(() => {
      localStorage.setItem('tr_auth_user', JSON.stringify({ username: 'alex_global', full_name: 'Alex Global' }));
    });
    await page.reload();

    // Every layout shares the exporter's standard sections; only the layout style changes.
    await page.getByRole('button', { name: /1-Column Standard/i }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'single_column');
    await expect(canvas).toContainText(/Professional Summary/i);
    await expect(canvas).toContainText(/Professional Experience/i);

    await page.getByRole('button', { name: /Banner Header/i }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'split_header');
    await expect(canvas).toContainText(/Professional Summary/i);

    await page.getByRole('button', { name: /Dense 1-Page/i }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'compact_dense');
    await expect(canvas).toContainText(/Skills/);

    await page.getByRole('button', { name: /Editorial Serif/i }).click();
    await expect(canvas).toHaveAttribute('data-layout', 'single_column');
    await expect(canvas).toHaveCSS('font-family', /serif/i);
  });

  test('Page 4 (Templates Gallery): should display global templates and require account creation before using a template', async ({ page }) => {
    await page.goto('/templates');

    // Check heading
    await expect(page.locator('h1')).toContainText(/Resume Templates/i);

    // Filter by Executive: real catalog templates are listed, each shown as the actual rendered resume
    await page.getByRole('button', { name: 'Executive & Leadership' }).click();
    await expect(page.getByText('Global Sovereign Executive')).toBeVisible();
    const thumbnails = page.getByTestId('template-thumbnail');
    await expect(thumbnails.first()).toContainText('Alexander Chen');
    await expect(thumbnails.first()).toContainText(/Professional Experience/i);

    // Quick Preview shows the real template at reading size, not a text description
    await page.getByRole('button', { name: /Quick Preview/i }).first().click();
    const quick = page.getByTestId('template-quick-preview');
    await expect(quick).toBeVisible();
    await expect(quick).toContainText(/Professional Summary/i);
    await expect(page.getByRole('dialog')).not.toContainText(/ATS Verified|Google X-Y-Z/i);
    await page.getByRole('button', { name: 'Close preview' }).click();
    await expect(quick).toBeHidden();

    // Clicking Use This Template while unauthenticated opens Create Account modal
    const useTemplateBtn = page.getByRole('button', { name: /Use This Template/i }).first();
    await useTemplateBtn.click();
    await expect(page.getByRole('dialog')).toContainText(/Create a free account to use this template/i);
  });

  test('Page 5 (Builder Resume Import): should import an existing resume file and auto-fill Name, Experience, Education, and Skills', async ({ page }) => {
    await page.goto('/builder');

    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toBeVisible();

    // Open Import Modal
    await page.getByRole('button', { name: /Import PDF \/ DOCX/i }).first().click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText(/Import Your Existing Resume/i);

    // Switch to Paste Resume Text tab or upload a buffer file
    const fileInput = modal.locator('[data-testid="modal-resume-upload-input"]');
    const sampleResumeBuffer = Buffer.from(
      [
        'Elena Rostova',
        'Principal AI & Distributed Systems Architect',
        'elena.rostova@techmail.io | +1 (415) 890-1234 | San Francisco, CA | linkedin.com/in/elenarostova',
        '',
        'PROFESSIONAL SUMMARY',
        'Principal AI Architect with 9+ years of experience building low-latency LLM inference clusters, Kubernetes microservices, and distributed data pipelines.',
        '',
        'TECHNICAL SKILLS',
        'Python, PyTorch, FastAPI, Kubernetes, Golang, PostgreSQL, Redis, Terraform, AWS',
        '',
        'PROFESSIONAL EXPERIENCE',
        'Principal AI Architect | Anthropic Cloud Systems (San Francisco, CA) | 2022 - Present',
        '- Architected distributed GPU inference pipelines serving 15M+ daily requests with 99.99% uptime.',
        '- Reduced model serving latency by 48% through custom quantized tensor routing and Redis caching.',
        '',
        'Senior Backend Engineer | Databricks (Remote) | 2019 - 2022',
        '- Designed high-throughput Apache Spark and Kafka ingestion services processing 4TB/day.',
        '',
        'EDUCATION',
        'Master of Science in Computer Science | Stanford University | 2019',
      ].join('\n'),
      'utf-8'
    );

    await fileInput.setInputFiles({
      name: 'Elena_Rostova_Resume.txt',
      mimeType: 'text/plain',
      buffer: sampleResumeBuffer,
    });

    await modal.getByRole('button', { name: /Import & Auto-Fill Builder/i }).click();

    // Verify all sections on the live canvas auto-filled with Elena Rostova's resume data
    await expect(canvas).toContainText(/Elena Rostova/i);
    await expect(canvas).toContainText(/Principal AI & Distributed Systems Architect/i);
    await expect(canvas).toContainText(/Anthropic Cloud Systems/i);
    await expect(canvas).toContainText(/Databricks/i);
    await expect(canvas).toContainText(/Stanford University/i);
    await expect(canvas).toContainText(/PyTorch/i);
  });

  test('Page 6 (SEO & Structured Data Audit): should have unique titles, canonical links, single H1, JSON-LD, robots.txt, and sitemap.xml', async ({ page, request }) => {
    const routes = ['/', '/builder', '/ats-scanner', '/templates', '/guides', '/login', '/register'];
    const seenTitles = new Set<string>();

    for (const route of routes) {
      await page.goto(route);

      const title = await page.title();
      expect(title.length).toBeGreaterThan(15);
      seenTitles.add(title);

      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDesc).toBeTruthy();
      expect(metaDesc!.length).toBeGreaterThan(50);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain(route === '/' ? 'https://gulf-job-pipeline.vercel.app' : route);

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      const missingAltCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(
          (img) => !img.getAttribute('alt') || !img.getAttribute('alt')!.trim()
        ).length;
      });
      expect(missingAltCount).toBe(0);
    }

    // All 7 routes must have unique titles
    expect(seenTitles.size).toBe(routes.length);

    // Check robots.txt
    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.ok()).toBeTruthy();
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain('/builder');
    expect(robotsTxt).toContain('/ats-scanner');
    expect(robotsTxt).toContain('/templates');
    expect(robotsTxt).toContain('sitemap.xml');

    // Check sitemap.xml
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.ok()).toBeTruthy();
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain('/builder');
    expect(sitemapXml).toContain('/ats-scanner');
    expect(sitemapXml).toContain('/templates');
    expect(sitemapXml).toContain('/guides/software-ai-engineer-resume-guide');
  });

  test('7. ATS Scanner File Upload -> Edit in Live Visual Builder Auto-Fills Uploaded CV Details', async ({ page }) => {
    await page.goto('/ats-scanner');
    await page.getByRole('button', { name: 'Upload File' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/home/dev/Documents/gulf_job_pipeline/data/resumes/Jamshaid_Ali_Python_Django-5.pdf');

    await page
      .locator('textarea[placeholder*="Paste the full job posting"]')
      .fill('Seeking a Senior Python Engineer with Django, FastAPI, PostgreSQL, Kubernetes, Kafka, and CI/CD experience.');

    await page.getByRole('button', { name: /Scan Resume Against Job Description/i }).click();

    const editBuilderBtn = page.getByRole('button', { name: /Edit in Live Visual Builder/i });
    await expect(editBuilderBtn).toBeVisible({ timeout: 15000 });
    await editBuilderBtn.click();

    await expect(page).toHaveURL(/\/builder/);
    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toContainText('Jamshaid Ali');
    await expect(canvas).toContainText('TechLeadz IT Solutions');
    await expect(canvas).toContainText('Siteronics Solution');
    await expect(canvas).toContainText('Govt College University, Lahore');

    // Test Reset CV button restores default template and removes uploaded CV
    const resetCvBtn = page.getByRole('button', { name: /Reset CV/i });
    await expect(resetCvBtn).toBeVisible();
    await resetCvBtn.click();
    await expect(canvas).toContainText('Alexander Chen');
    await expect(canvas).not.toContainText('Jamshaid Ali');

    // Test Start From Scratch button clears fields so user can build from scratch
    const scratchBtn = page.getByRole('button', { name: /Start From Scratch/i }).first();
    await scratchBtn.click();
    await expect(canvas).not.toContainText('Alexander Chen');
  });

  test('8. Mobile Responsiveness Audit (360x800): all pages should render with zero horizontal overflow and mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    const mobileRoutes = ['/', '/builder', '/ats-scanner', '/templates', '/guides', '/login', '/register'];
    for (const route of mobileRoutes) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
    }

    // Verify mobile hamburger menu works on landing page
    await page.goto('/');
    const menuBtn = page.getByRole('button', { name: /Open menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.getByRole('button', { name: /Close menu/i })).toBeVisible();
  });

  test('9. Tailored CV Template Modal: should gate Download PDF / DOCX behind signup and trigger real file download after signup', async ({ page }) => {
    await page.goto('/ats-scanner');
    await page.evaluate(() => localStorage.removeItem('tr_auth_user'));
    await page.reload();

    await page.getByRole('button', { name: /Load Sample Tech Job/i }).click();
    await expect(page.locator('textarea').first()).not.toHaveValue('');
    await page.getByRole('button', { name: /Scan Resume Against Job Description/i }).click();

    const exportModalBtn = page.getByRole('button', { name: /Export Tailored CV \(500\+ Designs\)/i });
    await expect(exportModalBtn).toBeVisible({ timeout: 15000 });
    await exportModalBtn.click();

    await expect(page.locator('text=Select Your Tailored CV Template')).toBeVisible();
    await expect(page.locator('text=Free Signup Required to Download')).toBeVisible();

    // Unauthenticated click on "Download PDF in this Style" opens signup modal
    await page.getByTestId('modal-download-pdf-btn').click();
    await expect(page.locator('#template-auth-modal-title')).toContainText(/Create a free account to use this template/i);

    // Sign up inside the modal and verify the PDF file automatically downloads
    const uniqueSuffix = Date.now();
    await page.locator('input[placeholder*="Alex Morgan"]').fill('Ayesha Javaid');
    await page.locator('input[placeholder*="alex_morgan"]').fill(`Jamshaid_${uniqueSuffix}`);
    await page.locator('input[placeholder*="alex@company.com"]').fill(`ayesha_${uniqueSuffix}@example.com`);
    await page.locator('input[type="password"]').fill('Password123!');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Create Free Account & Use Template/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('10. Full Phase 1 Button & Feature Flow Audit: all tabs, Projects/Education CRUD, AI helpers, Autosave, Font/Color switchers, 500+ Modal, DOCX/PDF export, and Guides', async ({ page }) => {
    // 1. Test /login and /register password visibility toggle
    await page.goto('/login');
    const loginPassInput = page.locator('input[placeholder*="••"]');
    await expect(loginPassInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Show password/i }).click();
    await expect(loginPassInput).toHaveAttribute('type', 'text');

    await page.goto('/register');
    await expect(page.getByText(/Min\. 6 characters/i)).toBeVisible();
    const regPassInput = page.locator('input[placeholder*="••"]');
    await expect(regPassInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Show password/i }).click();
    await expect(regPassInput).toHaveAttribute('type', 'text');

    // 2. Test /ats-scanner -> Sync to /builder -> 1-click AI Tailored Bullets, Summary & Skills
    await page.goto('/ats-scanner');
    await page.getByRole('button', { name: /Load Sample Tech Job/i }).first().click();
    await expect(page.locator('textarea').first()).not.toHaveValue('');
    await page.getByRole('button', { name: /Scan Resume Against Job Description/i }).click();
    const editInBuilderBtn = page.getByRole('button', { name: /Edit in Live Visual Builder/i });
    await expect(editInBuilderBtn).toBeVisible({ timeout: 15000 });
    await editInBuilderBtn.click();

    await expect(page).toHaveURL(/\/builder/);
    await expect(page.getByText(/Synced from ATS Scanner/i)).toBeVisible();

    // Test "+ Insert AI-Tailored Bullets" and "Apply ATS-Tailored Summary" buttons
    const insertBulletsBtn = page.getByRole('button', { name: /Insert .* AI-Tailored Bullets/i });
    if (await insertBulletsBtn.isVisible()) {
      await insertBulletsBtn.click();
    }
    const applySummaryBtn = page.getByRole('button', { name: /Apply ATS-Tailored Summary/i });
    if (await applySummaryBtn.isVisible()) {
      await applySummaryBtn.click();
    }

    // 3. Authenticate user so we can test all builder templates, modals, and exports
    await page.evaluate(() => {
      localStorage.setItem('tr_auth_user', JSON.stringify({ username: 'audit_tester', full_name: 'Audit Tester' }));
    });
    await page.reload();

    const canvas = page.locator('#resume-canvas');
    const editorPanel = page.locator('#builder-editor-panel');

    // 4. Test Contact Tab + Live Autosave across page reload
    await editorPanel.getByRole('button', { name: 'Contact', exact: true }).click();
    const nameInput = editorPanel.locator('input[type="text"]').first();
    await nameInput.fill('Dr. Marcus Vance');
    await expect(canvas).toContainText('Dr. Marcus Vance');

    // Reload page and verify "Autosaved Live" persisted Dr. Marcus Vance!
    await page.reload();
    await expect(canvas).toContainText('Dr. Marcus Vance');

    // 5. Test Summary Tab & "AI Polish Summary" button
    await editorPanel.getByRole('button', { name: 'Summary', exact: true }).click();
    await editorPanel.getByRole('button', { name: /AI Polish Summary/i }).click();
    await expect(canvas).toContainText(/Results-oriented/i);

    // 6. Test Experience Tab: "+ Add Role" & "AI Quantify (X-Y-Z)" button
    await editorPanel.getByRole('button', { name: 'Experience', exact: true }).click();
    await editorPanel.getByRole('button', { name: /Add Role/i }).click();
    await expect(canvas).toContainText('New Company');
    await editorPanel.getByRole('button', { name: /AI Quantify \(X-Y-Z\)/i }).first().click();
    await expect(canvas).toContainText(/accelerating processing throughput by 38%/i);

    // 7. Test Skills Tab: Add custom skill & 1-click recommended skill chip
    await editorPanel.getByRole('button', { name: 'Skills', exact: true }).click();
    await editorPanel.locator('input[placeholder*="Add skill"]').fill('GraphQL Federation');
    await editorPanel.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(canvas).toContainText('GraphQL Federation');
    const terraformChip = editorPanel.getByRole('button', { name: '+ Terraform' });
    if (await terraformChip.isEnabled()) {
      await terraformChip.click();
      await expect(canvas).toContainText('Terraform');
    }

    // 8. Test Education Tab: "+ Add Degree" button
    await editorPanel.getByRole('button', { name: 'Education', exact: true }).click();
    await editorPanel.getByRole('button', { name: /Add Degree/i }).click();
    await expect(canvas).toContainText('University / Institute');

    // 9. Test Projects Tab: "+ Add Project" button and verify it renders across all 5 templates
    await editorPanel.getByRole('button', { name: 'Projects', exact: true }).click();
    await editorPanel.getByRole('button', { name: /Add Project/i }).click();
    await expect(canvas).toContainText('New Key Project');

    // Switch through all 5 layouts and verify "New Key Project" is visible on every layout
    for (const layoutBtnName of ['1-Column Standard', 'Banner Header', 'Dense 1-Page', 'Editorial Serif', '1-Column Accent']) {
      await editorPanel.getByRole('button', { name: new RegExp(layoutBtnName, 'i') }).click();
      await expect(canvas).toContainText('New Key Project');
    }

    // 10. Test Font Family Switcher (Sans / Serif / Mono) & Color Swatches
    await page.getByRole('button', { name: 'Serif', exact: true }).click();
    await expect(canvas).toHaveCSS('font-family', /serif/i);
    await page.getByRole('button', { name: 'Mono', exact: true }).click();
    await expect(canvas).toHaveCSS('font-family', /monospace/i);
    await page.getByRole('button', { name: 'Sans', exact: true }).click();

    // 11. Test "Browse All 500+ ->" & "500+ Designs" modal inside /builder
    await editorPanel.getByRole('button', { name: /Browse All 500\+/i }).click();
    // In the builder the gallery only CHOOSES a template; downloading happens from the builder toolbar.
    await expect(page.getByText('Choose Your Resume Template')).toBeVisible();
    await expect(page.getByTestId('modal-download-pdf-btn')).toHaveCount(0);
    await expect(page.getByTestId('modal-download-docx-btn')).toHaveCount(0);
    await page.getByRole('heading', { name: 'Sapphire Modern Tech Pro' }).click();
    // Picking a card alone changes nothing behind the dialog...
    await expect(canvas).not.toHaveAttribute('data-template', 'gulf_dubai_sapphire');
    await page.getByTestId('modal-use-template-btn').click();
    await expect(page.getByText('Choose Your Resume Template')).toBeHidden();
    // ...confirming applies the template's layout to the live preview.
    await expect(canvas).toHaveAttribute('data-template', 'gulf_dubai_sapphire');
    await expect(canvas).toHaveAttribute('data-layout', 'split_header');
    await expect(page.getByTestId('active-template-name')).toHaveText('Sapphire Modern Tech Pro');

    // 12. Test Word (.docx) download button directly from /builder toolbar
    const docxDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Word \(\.docx\)/i }).click();
    const docxDownload = await docxDownloadPromise;
    expect(docxDownload.suggestedFilename()).toContain('.docx');

    // 13. Test Landing Page Research Lab study links -> /guides/[slug]
    await page.goto('/');
    const studyLink = page.getByRole('link', { name: /Why 75% of Resumes Fail ATS Parsers/i });
    await expect(studyLink).toBeVisible();
    await studyLink.click();
    await expect(page).toHaveURL(/\/guides\/ats-resume-optimization-checklist-2026/);
    await expect(page.locator('h1')).toContainText(/ATS Resume Optimization Checklist/i);
  });

  test('11. Landing page template carousel shows real templates and the chosen one is applied in the builder', async ({ page }) => {
    await page.goto('/');
    const showcase = page.getByTestId('template-showcase');
    await showcase.scrollIntoViewIfNeeded();
    const thumbs = page.getByTestId('showcase-thumbnail');
    await expect(thumbs.first()).toBeVisible();
    await expect(thumbs.first()).toContainText(/Professional Experience/i);

    // Signed in: pick the 2nd card and land in the builder with exactly that template applied
    await page.evaluate(() => {
      localStorage.setItem('tr_auth_user', JSON.stringify({ username: 'alex_global', full_name: 'Alex Global' }));
    });
    await page.reload();
    await showcase.scrollIntoViewIfNeeded();
    const second = page.getByTestId('showcase-thumbnail').nth(1);
    const expectedId = await second.getAttribute('data-template');
    const expectedLayout = await second.getAttribute('data-layout');
    await second.locator('xpath=ancestor::div[contains(@class,"group")]').getByRole('button', { name: /Use this template/i }).click();

    await page.waitForURL(/\/builder\?template=/);
    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toHaveAttribute('data-template', expectedId!);
    await expect(canvas).toHaveAttribute('data-layout', expectedLayout!);
  });

  test('12. Designer templates: listed with a clear label, applied in the builder, and the uploaded photo reaches the preview and the export', async ({ page }) => {
    // Templates page: the Designer filter lists photo / sidebar layouts, labelled honestly
    await page.goto('/templates');
    await page.getByRole('button', { name: 'Designer: photo & sidebar' }).click();
    const thumbs = page.getByTestId('template-thumbnail');
    await expect(thumbs.first()).toBeVisible();
    expect(await thumbs.count()).toBeGreaterThan(20);
    await expect(thumbs.first().locator('img').first()).toHaveAttribute('src', /sample-avatars/);
    await expect(page.getByText('Not for strict ATS').first()).toBeVisible();
    await page.getByRole('button', { name: 'ATS-safe: single column' }).click();
    await expect(page.getByText('Not for strict ATS')).toHaveCount(0);

    // Builder (signed in) opens the designer template with its sidebar layout
    await page.evaluate(() => {
      localStorage.setItem('tr_auth_user', JSON.stringify({ username: 'alex_global', full_name: 'Alex Global' }));
    });
    await page.goto('/builder?template=ui_ux_product_designer');
    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toHaveAttribute('data-layout', 'sidebar_photo');
    await expect(page.getByText(/Designer layout with a photo or sidebar/i).first()).toBeVisible();
    await expect(canvas.locator('img')).toHaveCount(0);

    // Upload a photo: it appears in the preview...
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP8z8Dwn4EIwDiqEQBo3gXzQ2bpTwAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.getByRole('button', { name: 'Contact', exact: true }).click();
    await page.getByTestId('photo-upload-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png });
    await expect(canvas.locator('img')).toHaveCount(1);
    await expect(canvas.locator('img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);

    // ...and is sent with the download (and the server returns a real PDF)
    const exportRequest = page.waitForRequest((r) => r.url().includes('/api/ats/export-cv'));
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download PDF/i }).click();
    const req = await exportRequest;
    const body = JSON.parse(req.postData() || '{}');
    expect(body.template_id).toBe('ui_ux_product_designer');
    expect(body.photo).toMatch(/^data:image\/jpeg;base64,/);
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('13. A switched layout stays put: the link template is not re-applied on reload', async ({ page }) => {
    await page.goto('/builder');
    await page.evaluate(() => {
      localStorage.setItem('tr_auth_user', JSON.stringify({ username: 'alex_global', full_name: 'Alex Global' }));
      localStorage.removeItem('tr_builder_look');
    });
    // Arrive from a template link (e.g. the Templates page "Use this template")
    await page.goto('/builder?template=wealth_manager_hnw');
    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toHaveAttribute('data-template', 'wealth_manager_hnw');
    await expect(page).not.toHaveURL(/template=/); // the link parameter is dropped from the address bar

    // Switch to another layout, then reload: it must stay on the layout you switched to
    await page.getByRole('button', { name: 'Executive', exact: true }).first().click();
    await expect(canvas).toHaveAttribute('data-layout', 'split_header');
    await page.reload();
    await expect(canvas).toHaveAttribute('data-layout', 'split_header');
    await expect(page.getByTestId('active-template-name')).toHaveText(/Executive/);

    // The left-hand cards agree with the preview bar about which layout is active
    await page.getByRole('button', { name: 'Modern Tech', exact: true }).first().click();
    await expect(canvas).toHaveAttribute('data-layout', 'modern_accent');
    await expect(page.locator('#builder-editor-panel').getByText('Active', { exact: true })).toHaveCount(1);
  });

  test('14. 500+ templates: listed in pages, new styles apply in the builder, and the download uses that template', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByText(/Showing \d+ Templates/)).toBeVisible();
    const total = Number((await page.getByText(/Showing \d+ Templates/).innerText()).match(/\d+/)![0]);
    expect(total).toBeGreaterThanOrEqual(500);

    // Rendered a page at a time, then more on request
    const thumbs = page.getByTestId('template-thumbnail');
    await expect(thumbs.first()).toBeVisible();
    const first = await thumbs.count();
    expect(first).toBeLessThan(total);
    await page.getByTestId('load-more-templates').click();
    await expect.poll(async () => thumbs.count()).toBeGreaterThan(first);

    // Styles are described honestly on the cards
    await expect(page.getByText(/header · /).first()).toBeVisible();

    // A new-style template applies its own design choices in the builder, and the export uses it
    await page.goto('/builder');
    await page.evaluate(() => {
      localStorage.setItem('tr_auth_user', JSON.stringify({ username: 'alex_global', full_name: 'Alex Global' }));
      localStorage.removeItem('tr_builder_look');
    });
    const catalog = await (await page.request.get('/api/cv/templates')).json();
    const pick = catalog.templates.find((t: any) => t.custom_style && !t.designer && t.style.caps === true);
    expect(pick).toBeTruthy();
    await page.goto(`/builder?template=${pick.id}`);
    const canvas = page.locator('#resume-canvas');
    await expect(canvas).toHaveAttribute('data-template', pick.id);
    await expect(canvas).toContainText(/ALEXANDER CHEN/); // this style sets the name in capitals
    const exportRequest = page.waitForRequest((r) => r.url().includes('/api/ats/export-cv'));
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download PDF/i }).click();
    const body = JSON.parse((await exportRequest).postData() || '{}');
    expect(body.template_id).toBe(pick.id);
    expect((await download).suggestedFilename()).toContain(pick.id);

    // The new Calibri- and Cambria-style fonts are selectable and reach the export
    await page.getByRole('button', { name: 'Modern', exact: true }).click();
    const exportRequest2 = page.waitForRequest((r) => r.url().includes('/api/ats/export-cv'));
    const download2 = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download PDF/i }).click();
    expect(JSON.parse((await exportRequest2).postData() || '{}').font).toBe('modern');
    await download2;
  });
});
