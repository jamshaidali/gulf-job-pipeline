export type GuideBlock =
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'example'; before: string; after: string }
  | { t: 'tip'; text: string };

export interface GuideSection {
  h: string;
  blocks: GuideBlock[];
}

export interface CareerGuide {
  slug: string;
  /** On-page H1 (can be long). */
  title: string;
  /** <title> text, kept short so Google does not cut it off. "| RateYourCV" is added by the page. */
  metaTitle: string;
  excerpt: string;
  market: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  publishedISO: string;
  highlights: string[];
  sections: GuideSection[];
}

const p = (text: string): GuideBlock => ({ t: 'p', text });
const ul = (...items: string[]): GuideBlock => ({ t: 'ul', items });
const ol = (...items: string[]): GuideBlock => ({ t: 'ol', items });
const ex = (before: string, after: string): GuideBlock => ({ t: 'example', before, after });
const tip = (text: string): GuideBlock => ({ t: 'tip', text });

const wordsOf = (sections: GuideSection[]): number =>
  sections
    .flatMap((s) => [s.h, ...s.blocks.flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? b.items : [b.before, b.after]))])
    .join(' ')
    .split(/\s+/).length;

const minutes = (sections: GuideSection[]): string => `${Math.max(3, Math.round(wordsOf(sections) / 220))} min read`;

type GuideInput = Omit<CareerGuide, 'readingTime'>;

const NOV = { publishedAt: 'November 2026', publishedISO: '2026-11-25T00:00:00Z' };

const raw: GuideInput[] = [
  /* ---------------------------------------------------------------- ATS checklist */
  {
    slug: 'ats-resume-optimization-checklist-2026',
    title: 'The 2026 ATS Resume Checklist: Format, Keywords and Common Mistakes',
    metaTitle: 'ATS Resume Checklist for 2026',
    excerpt:
      'A practical checklist for making a resume readable by applicant tracking systems: the layout to use, how to match keywords honestly, and the mistakes that cause parsing problems.',
    market: 'ATS Optimization',
    category: 'ATS & CV Strategy',
    ...NOV,
    highlights: [
      'What an applicant tracking system (ATS) actually does with your resume',
      'The layout, font and heading choices that parse most reliably',
      'How to pick keywords from a job description without stuffing',
      'A final checklist to run before you apply',
    ],
    sections: [
      {
        h: 'What an ATS does (and does not do)',
        blocks: [
          p('An applicant tracking system, or ATS, is software employers use to collect applications, store resumes and let recruiters search and filter them. Common examples include Workday, Taleo, Greenhouse, Lever and iCIMS.'),
          p('When you upload a resume, the system tries to read it into fields: name, contact details, job titles, employers, dates, skills and education. A recruiter then searches or filters those fields. If the system cannot read your resume properly, the right details may not appear in that search.'),
          p('How strictly each employer uses filtering and scoring differs a lot, and the vendors do not publish exact rules. So treat any advice, including this checklist, as a way to lower the risk of misreading rather than a guarantee. The safest approach is a resume that a machine and a person can both read quickly.'),
        ],
      },
      {
        h: 'Layout: keep it simple',
        blocks: [
          ul(
            'Use a single column. Multi-column layouts, sidebars and text boxes are the most commonly reported cause of jumbled parsing.',
            'Put contact details in the main body, not in the page header or footer, which some systems skip.',
            'Avoid tables, icons, skill bars, charts and images for anything important. A photo adds nothing for a parser.',
            'Use real, selectable text. Export to PDF from a builder or Word, not a scanned image or a screenshot.',
            'Use a standard font such as Arial, Calibri, Times New Roman or Cambria at 10 to 12 pt.',
            'Use reverse-chronological order: your most recent job first.'
          ),
          tip('Designer templates with a sidebar or photo are fine for sending directly to a person. For online applications that run through an ATS, use a single-column template.'),
        ],
      },
      {
        h: 'Headings: use the standard names',
        blocks: [
          p('Parsers look for familiar section names. Creative headings like "My Journey" or "What I Bring" can be skipped or misfiled. Use these instead:'),
          ul('Professional Summary (or Summary)', 'Skills', 'Experience or Work Experience', 'Education', 'Projects or Certifications, if relevant'),
          p('Write job entries the same way every time: job title, company, location, then dates. Use a clear date format such as "Jan 2023 – Present" and keep it consistent.'),
        ],
      },
      {
        h: 'Keywords: match the job, honestly',
        blocks: [
          p('Recruiters often search by skill and job title, so the words in your resume matter. The job description tells you which words the employer uses.'),
          ol(
            'Read the job description and underline the skills, tools, qualifications and job titles it repeats.',
            'Compare that list with your resume. Note the ones you genuinely have but have not written down.',
            'Add them where they naturally belong: in your skills list and in the bullet points that describe the work.',
            'Use the exact wording the employer uses. If the job asks for "PostgreSQL" and you wrote only "SQL", add "PostgreSQL" if you have used it.'
          ),
          tip('Only list skills you can discuss in an interview. Copying keywords you do not have can get you through a search but not through the conversation, and it can end the process later.'),
          p('Use acronyms and the full term at least once, for example "Search Engine Optimization (SEO)", because people and systems search both ways.'),
        ],
      },
      {
        h: 'Bullet points: show results',
        blocks: [
          p('Start each bullet with a strong verb and, where you can, include a number: how many, how much, how fast, how often. If you do not know an exact figure, do not invent one. Use an honest range or describe the scale instead.'),
          ex('Worked on backend APIs and fixed database bugs.', 'Rebuilt the order-lookup queries and added caching, cutting average response time from 800 ms to 460 ms.'),
        ],
      },
      {
        h: 'Final checklist before you apply',
        blocks: [
          ul(
            'Single column, no tables, text boxes or images carrying information',
            'Name and contact details in the body of the page',
            'Standard section headings',
            'Consistent dates, newest job first',
            'Keywords from this specific job included where truthful',
            'File saved as a PDF (or DOCX if the employer asks for it) with a plain name like "Firstname-Lastname-Resume"',
            'Copy-paste test: paste the text into a plain-text editor. If it comes out in the right order, a parser will most likely read it well too.'
          ),
          p('You can run this check automatically with the RateYourCV ATS Scanner: paste a job description and your resume, and it lists missing keywords and formatting issues to fix.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Software engineer */
  {
    slug: 'software-ai-engineer-resume-guide',
    title: 'Software and AI Engineer Resume Guide: What to Include and How to Write It',
    metaTitle: 'Software Engineer Resume Guide (2026)',
    excerpt:
      'How to write a software, cloud or AI engineer resume: structure, skills section, project bullets that show scale and impact, and mistakes that make strong engineers look average.',
    market: 'Engineering & AI',
    category: 'Tech Resumes',
    ...NOV,
    highlights: [
      'The order of sections that works for engineering roles',
      'How to group a technical skills section so it is easy to scan',
      'Writing bullets that show scale, performance and ownership',
      'What to do with side projects, open source and certifications',
    ],
    sections: [
      {
        h: 'What engineering hiring teams read for',
        blocks: [
          p('Recruiters usually look first for a match with the role: the right languages, tools and level of experience. Engineers and hiring managers who read it next look for evidence that you built and ran real systems, and what changed because of your work.'),
          p('So your resume has two jobs: be easy to match on keywords, and give concrete evidence behind them. A list of languages with no context does the first but not the second.'),
        ],
      },
      {
        h: 'Section order',
        blocks: [
          ol(
            'Header: name, email, phone, city, and links to GitHub, LinkedIn or a portfolio.',
            'Summary: two or three lines with your title, years of experience and your strongest area.',
            'Skills: grouped by type.',
            'Experience: reverse-chronological, with bullets for each role.',
            'Projects: two or three, only if they add something your jobs do not show.',
            'Education and certifications.'
          ),
          p('If you are early in your career, move Projects above Experience and keep everything to one page. Experienced engineers can use two.'),
        ],
      },
      {
        h: 'Group your skills',
        blocks: [
          p('A single long list is hard to scan. Group related tools so a reader can check the stack in seconds:'),
          ul(
            'Languages: Python, Go, TypeScript, SQL',
            'Frameworks and APIs: FastAPI, Django, React, REST, GraphQL',
            'Cloud and DevOps: AWS, Docker, Kubernetes, Terraform, CI/CD',
            'Data: PostgreSQL, Redis, Kafka'
          ),
          p('List what you actually use. If the job asks for something you have only touched briefly, say so honestly or leave it for the interview rather than listing it as a core skill.'),
        ],
      },
      {
        h: 'Write bullets that show impact',
        blocks: [
          p('Good engineering bullets answer three questions: what did you build or change, what technology did you use, and what improved. The improvement can be speed, reliability, cost, scale, team time saved or users served.'),
          ex('Responsible for writing Python code for the payments service.', 'Built payment-routing APIs in FastAPI and PostgreSQL that handled 2M daily transactions, and reduced p99 latency by adding query indexes and caching.'),
          p('Useful things to quantify, when you know the real numbers: requests per second, latency, uptime, build or deploy time, cloud cost, test coverage, incident count, and the size of the team you led or mentored.'),
          tip('If you do not have exact figures, use what you do know: "used by the whole 12-person team", "replaced a weekly manual process". Never invent numbers; interviewers ask how you measured them.'),
        ],
      },
      {
        h: 'Projects, open source and certifications',
        blocks: [
          ul(
            'Include a link to the code or a live demo. It is the easiest way to prove what you can do.',
            'Describe the problem, your part and the stack in one or two bullets.',
            'Open-source contributions that were accepted are worth listing with the project name.',
            'List certifications only if they are current and relevant to the role.'
          ),
        ],
      },
      {
        h: 'Common mistakes',
        blocks: [
          ul(
            'Listing every technology you have ever touched, which makes your real strengths harder to see',
            'Describing duties ("responsible for...") instead of outcomes',
            'Using a two-column or graphic template for online applications',
            'Leaving off dates or links, or using a different tense in each bullet',
            'Writing more than two pages'
          ),
          p('Once your resume is ready, tailor it to each job: move the most relevant skills and bullets to the top, and mirror the job description\'s wording where it is true. The guide on tailoring a resume to a job description walks through it.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Executive */
  {
    slug: 'executive-product-leadership-resume-blueprint',
    title: 'Executive and Product Leadership Resume Guide for Director and VP Roles',
    metaTitle: 'Executive & Product Leader Resume Guide',
    excerpt:
      'How senior leaders show scope, strategy and business results on a one-to-two page resume: summary, metrics that matter, team scale and how to stay readable.',
    market: 'Executive & Product',
    category: 'Leadership Strategy',
    ...NOV,
    highlights: [
      'A summary that states your scope in the first few lines',
      'The leadership metrics worth including',
      'How to balance strategy with hands-on delivery',
      'Length, format and what to leave out',
    ],
    sections: [
      {
        h: 'What senior hiring committees look for',
        blocks: [
          p('At director and VP level, readers are less interested in the tasks you did and more in the size of what you ran and the results it produced. They want to see scope (teams, budget, markets), decisions you owned and outcomes you can point to.'),
          p('A senior resume should still be easy to skim. Executives and search consultants read many of them, often quickly, so the key facts need to be near the top.'),
        ],
      },
      {
        h: 'Open with a scope statement',
        blocks: [
          p('Your summary should tell a reader in a few lines who you are and what level you operate at. Include your function, your years of experience, the size of the organization or team you led, and one or two areas you are known for.'),
          ex('Experienced product leader looking for a challenging role.', 'Product leader with 12 years in B2B software, most recently leading a 40-person product and design organization across three business lines. Focused on turning roadmaps into measurable revenue and retention gains.'),
          p('Use your real numbers. If a figure is confidential, describe it in a range or in relative terms, such as "grew the product line to the company\'s second-largest revenue source".'),
        ],
      },
      {
        h: 'Metrics that carry weight',
        blocks: [
          ul(
            'Revenue and growth: new revenue, ARR, conversion or expansion you influenced',
            'Efficiency: cost reduced, cycle time shortened, process automated',
            'Team: people hired, managed, promoted and retained, and how the org changed',
            'Customers: retention, churn, satisfaction scores, enterprise accounts won',
            'Budget and scope: P&L size, regions, number of products or business units'
          ),
          p('Say what you personally did. "Led the team that..." and "Owned the decision to..." read better than a list of outcomes with no ownership.'),
        ],
      },
      {
        h: 'Balance strategy with hands-on work',
        blocks: [
          p('Show that you can set direction and also deliver. For each role, combine one bullet on strategy (a market or product decision) with one on execution (what shipped and how you got a team there). Avoid empty phrases such as "visionary leader" unless a result follows them.'),
        ],
      },
      {
        h: 'Format and length',
        blocks: [
          ul(
            'Two pages is normal for a senior career. One page is fine if it covers everything important.',
            'Go back about 10 to 15 years in detail. Earlier roles can be a short list.',
            'Keep a clean single-column layout so the document works for both executive search firms and online applications.',
            'Put board seats, publications and speaking in a short section at the end, not at the top.'
          ),
          p('Finally, tailor the first third of the resume to each application. The ATS Scanner can show which terms from a job description your resume is missing.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Tailor to JD */
  {
    slug: 'how-to-tailor-your-resume-to-a-job-description',
    title: 'How to Tailor Your Resume to a Job Description in 15 Minutes',
    metaTitle: 'How to Tailor Your Resume to a Job',
    excerpt:
      'A step-by-step method for adapting one resume to each job: reading the posting, finding the keywords, reordering your content and checking the result without exaggerating.',
    market: 'Job Applications',
    category: 'Resume Writing',
    ...NOV,
    highlights: [
      'A repeatable five-step process',
      'How to find the words that matter in a job post',
      'What to change and what to leave alone',
      'How to keep a master resume so tailoring stays quick',
    ],
    sections: [
      {
        h: 'Why tailor at all',
        blocks: [
          p('A generic resume makes the reader do the work of connecting your experience to the job. A tailored one does it for them. It also helps with keyword searches, because it uses the same terms the employer used in the posting.'),
          p('Tailoring does not mean rewriting your history. It means choosing which true things to put first and describing them in the employer\'s language.'),
        ],
      },
      {
        h: 'Keep a master resume',
        blocks: [
          p('Write one long document with every job, project, skill and achievement you have. You will not send it anywhere. Each time you apply, copy it and cut it down to the most relevant one or two pages. This is much faster than editing a polished resume from scratch each time.'),
        ],
      },
      {
        h: 'The five steps',
        blocks: [
          ol(
            'Read the whole posting. Separate "must have" from "nice to have". The first requirements listed usually matter most.',
            'Highlight the repeated terms: job title, tools, skills, and responsibilities. If a term appears three times, it matters.',
            'Compare with your resume. Mark what you already do that is missing from your resume, and note honest gaps.',
            'Edit: rewrite the summary for this role, move the most relevant skills and bullets to the top, and use the posting\'s wording where it is accurate.',
            'Check the result. Read it as the recruiter would: does the top third show you are a match for this exact job?'
          ),
        ],
      },
      {
        h: 'What to change',
        blocks: [
          ul(
            'Headline and summary: name the target role and your most relevant strengths',
            'Skills: order them to match the job and add real skills that were missing',
            'Bullets: lead with the achievements most relevant to this role and cut the ones that are not',
            'Job titles: keep the real title, but you can add a clarifier, for example "Software Engineer (Backend)", if it is accurate'
          ),
        ],
      },
      {
        h: 'What not to change',
        blocks: [
          ul(
            'Dates, employers and qualifications. These are checked, and mismatches end applications.',
            'Skills you do not have. Keywords you cannot back up in an interview do not help.',
            'Numbers. Keep your real figures.'
          ),
          tip('A useful test: could you talk about every line for two minutes in an interview? If not, remove it.'),
        ],
      },
      {
        h: 'Do it faster',
        blocks: [
          p('The RateYourCV ATS Scanner compares your resume with a pasted job description, lists the keywords you are missing and suggests changes. Review each suggestion and apply only the ones that are true for you. Then open the builder to update your headline, summary, skills and bullets, and download the result.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Summary */
  {
    slug: 'how-to-write-a-resume-summary',
    title: 'How to Write a Resume Summary: Formula, Examples and Mistakes',
    metaTitle: 'How to Write a Resume Summary',
    excerpt:
      'Write a short professional summary that makes the reader want to continue: a simple three-part formula, examples for different career stages, and what to avoid.',
    market: 'Resume Writing',
    category: 'Examples',
    ...NOV,
    highlights: [
      'What a summary is and when to use one',
      'A three-part formula you can fill in',
      'Examples for experienced, early-career and career-change candidates',
      'Phrases to cut',
    ],
    sections: [
      {
        h: 'What a resume summary is',
        blocks: [
          p('A resume summary is two to four lines at the top of your resume that state who you are professionally, your strongest qualifications and what you are aiming for. It is the first thing many readers see, so it needs to be specific.'),
          p('If you have little experience, you can use a shorter "objective" instead, or skip it and let your education and projects lead. For everyone else, a good summary is worth the space.'),
        ],
      },
      {
        h: 'The three-part formula',
        blocks: [
          ol(
            'Who you are: your title and years of experience, for example "Marketing analyst with 5 years of experience".',
            'What you are good at: two or three skills or areas that match the job.',
            'What you have achieved: one real result, or the kind of work you do, to back it up.'
          ),
          p('Then adjust the wording for the job you are applying for. The same person might lead with analytics for one job and with campaign management for another.'),
        ],
      },
      {
        h: 'Examples',
        blocks: [
          p('These are illustrations. Replace every detail with your own facts.'),
          ex('Hard-working professional seeking a position with growth opportunities.', 'Customer support lead with 6 years in SaaS, managing a team of 8 and handling escalated enterprise accounts. Strong in onboarding, ticket triage and process documentation. Reduced average first-response time from 6 hours to 2.'),
          ex('Recent graduate looking for a job.', 'Computer science graduate with internship experience building REST APIs in Python and Django. Comfortable with SQL, Git and unit testing. Built a project tracker used by 30 classmates.'),
          ex('Experienced worker changing careers.', 'Operations coordinator moving into data analysis. Five years of reporting and process improvement, plus a completed SQL and Excel certification. Built weekly dashboards that replaced three manual reports.'),
        ],
      },
      {
        h: 'What to cut',
        blocks: [
          ul(
            'Empty adjectives: "hard-working", "team player", "passionate", "results-driven" with no result',
            'Personal pronouns: write "Led a team of 5", not "I led a team of 5"',
            'Duties that are obvious from your job title',
            'Anything longer than four lines',
            'Claims you cannot support: invented figures or skills'
          ),
          tip('Write the summary last. Once your experience section is finished, you will see which two or three strengths stand out most.'),
        ],
      },
      {
        h: 'Keep it relevant to the job',
        blocks: [
          p('Match the role title and one or two key skills from the posting, in the same words where that is accurate. It helps the reader see the fit straight away and puts important keywords where they are easy to find. The RateYourCV builder has a summary field and suggestions based on your own details and the job description you scan.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- XYZ */
  {
    slug: 'resume-bullet-points-xyz-formula',
    title: 'Resume Bullet Points: How to Use the X-Y-Z Formula With Examples',
    metaTitle: 'Resume Bullet Points: The X-Y-Z Formula',
    excerpt:
      'Turn job duties into achievements with the X-Y-Z formula: what you accomplished, how you measured it and what you did. Includes before-and-after examples and advice for when you have no numbers.',
    market: 'Resume Writing',
    category: 'Examples',
    ...NOV,
    highlights: [
      'What the X-Y-Z formula is and where it comes from',
      'Before-and-after examples',
      'What to do when you do not have exact numbers',
      'Strong verbs to start bullets with',
    ],
    sections: [
      {
        h: 'The formula',
        blocks: [
          p('The X-Y-Z formula was popularised by Laszlo Bock, who ran people operations at Google. It says a good resume bullet should read: "Accomplished [X], as measured by [Y], by doing [Z]."'),
          ul(
            'X is what you achieved',
            'Y is the evidence or measure: a number, a comparison or a result',
            'Z is what you actually did to get there'
          ),
          p('It turns a duty ("responsible for sales reports") into an achievement a reader can picture and compare.'),
        ],
      },
      {
        h: 'Before and after',
        blocks: [
          ex('Responsible for social media accounts.', 'Grew Instagram followers from 4,000 to 9,500 in six months by posting short videos three times a week and replying to every comment.'),
          ex('Handled customer complaints.', 'Resolved 40+ customer complaints a week with a 95% satisfaction rating by creating a reply template library and escalating urgent cases the same day.'),
          ex('Worked on website performance.', 'Cut homepage load time from 4.2 s to 1.8 s by compressing images and lazy-loading below-the-fold content.'),
          p('These are examples of the shape. Use your own numbers.'),
        ],
      },
      {
        h: 'When you do not have numbers',
        blocks: [
          p('Not every job produces a metric, and inventing one is risky. You have options:'),
          ul(
            'Scale: how many people, accounts, products, locations or requests you handled',
            'Frequency: daily, weekly, every release',
            'Comparison: faster than before, replaced a manual process, adopted by other teams',
            'Quality: awards, positive feedback, audits passed, zero errors in a period',
            'Ask: your manager, old reports or dashboards may hold numbers you forgot'
          ),
          tip('If you estimate, say so with words such as "about" or "over", and only use a number you could explain in an interview.'),
        ],
      },
      {
        h: 'Strong verbs to start with',
        blocks: [
          ul(
            'Built, designed, launched, created, developed',
            'Improved, reduced, increased, streamlined, automated',
            'Led, managed, coached, coordinated, trained',
            'Analyzed, researched, evaluated, forecast',
            'Negotiated, sold, won, secured'
          ),
          p('Use past tense for finished jobs and present tense for your current role, and vary the verbs so every bullet does not start the same way.'),
        ],
      },
      {
        h: 'How many bullets',
        blocks: [
          p('Three to five bullets per recent role is a good range. Keep older roles shorter. Put the most relevant achievement first, and cut anything that does not help you get this job.'),
          p('In the RateYourCV builder, the AI Quantify button adds a fill-in-the-blank like "[add result: X% / $Y / time saved]" to a bullet. It never makes up numbers: you enter your real result.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Resume vs CV */
  {
    slug: 'resume-vs-cv-difference',
    title: 'Resume vs CV: What Is the Difference and Which One Do You Need?',
    metaTitle: 'Resume vs CV: What Is the Difference?',
    excerpt:
      'The difference between a resume and a CV depends on the country and the job. Learn which to send in the US, UK, Gulf, India and Pakistan, and how long each should be.',
    market: 'Resume Basics',
    category: 'Resume Basics',
    ...NOV,
    highlights: [
      'The short answer: it depends on where you apply',
      'When a CV means a long academic document',
      'Typical expectations by region',
      'What to do if the job post is unclear',
    ],
    sections: [
      {
        h: 'The short answer',
        blocks: [
          p('In many countries, "resume" and "CV" (curriculum vitae) mean the same thing: a short summary of your work history, skills and education used to apply for jobs. In others they mean different documents.'),
        ],
      },
      {
        h: 'Where the two are different',
        blocks: [
          ul(
            'United States and Canada: a resume is a short document, usually one or two pages, tailored to each job. A CV is a longer, complete record of your academic career (publications, research, teaching), used for academic, scientific and medical roles.',
            'United Kingdom, Ireland, much of Europe, Australia and New Zealand: "CV" is the normal word for the standard job application document, usually two pages.',
            'India, Pakistan and the Gulf region: "CV" is the usual word, and it commonly means a short job application document. Some employers expect details such as nationality or a photo; others do not, so follow the job post.'
          ),
          tip('These are general patterns, not rules. Employers differ, so always follow what the job posting asks for.'),
        ],
      },
      {
        h: 'Length and content',
        blocks: [
          ul(
            'Standard job resume or CV: one to two pages, focused on the most relevant experience',
            'Academic CV: can run many pages, with publications, grants, conferences and teaching',
            'Both: reverse-chronological, with contact details, summary, experience, skills and education'
          ),
        ],
      },
      {
        h: 'Photos and personal details',
        blocks: [
          p('In the US and UK, photos and details such as age or marital status are generally left off, partly to reduce bias. In some other countries, including parts of Germany and the Gulf, a photo is more common. If the job posting asks for one, include it; if it says not to, leave it out. A photo is optional in RateYourCV designer templates and not used in the single-column ATS-safe ones.'),
        ],
      },
      {
        h: 'If you are not sure',
        blocks: [
          ol(
            'Read the job post: does it say resume, CV or something else, and does it set a page limit?',
            'Look at the employer\'s country and industry norms.',
            'When in doubt, send a one-to-two page, single-column document with standard headings. It works almost everywhere.'
          ),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- No experience */
  {
    slug: 'resume-with-no-experience',
    title: 'How to Write a Resume With No Experience (Student and Fresher Guide)',
    metaTitle: 'Resume With No Experience: Student Guide',
    excerpt:
      'No job history yet? Build a strong first resume from education, projects, volunteering and skills. Includes section order, example bullets and what to leave out.',
    market: 'Early Career',
    category: 'Resume Writing',
    ...NOV,
    highlights: [
      'What to put on a resume when you have no job history',
      'The best section order for students and fresh graduates',
      'Example bullets from projects, volunteering and coursework',
      'Mistakes to avoid',
    ],
    sections: [
      {
        h: 'You have more experience than you think',
        blocks: [
          p('Employers hiring a graduate or a first-time applicant know you do not have a long work history. They look for evidence that you can learn, finish things and work with others. That evidence can come from many places besides jobs.'),
          ul(
            'Projects: class, personal or group projects, apps, research, a portfolio',
            'Internships, part-time work and freelance jobs, including informal ones',
            'Volunteering, student societies, sports teams and leadership roles',
            'Coursework, certifications and online courses relevant to the job',
            'Languages and technical skills'
          ),
        ],
      },
      {
        h: 'Section order',
        blocks: [
          ol(
            'Contact details (name, email, phone, city, and links to LinkedIn or a portfolio).',
            'Short summary or objective: one or two lines naming the kind of role you want and your key skills.',
            'Education: degree, institution, dates, and relevant coursework or grades if strong.',
            'Projects or Experience: whichever is stronger first.',
            'Skills.',
            'Volunteering, certifications and activities.'
          ),
          p('Keep it to one page.'),
        ],
      },
      {
        h: 'Turn school and project work into bullets',
        blocks: [
          ex('Did a final-year project on a website.', 'Built a bookings website in React and Node.js for a final-year project, with login, search and email confirmations, tested with 15 users.'),
          ex('Member of the debating society.', 'Organized weekly practice sessions for 25 members and coordinated a three-team inter-university tournament.'),
          p('Use your real details. A number such as a team size, a user count or hours per week is enough to make a bullet concrete.'),
        ],
      },
      {
        h: 'Choose skills carefully',
        blocks: [
          p('List skills you can demonstrate. Technical skills (tools, languages, software) and practical ones (customer service, writing, languages spoken) both count. Take the main ones from the job posting if you truly have them. Skip vague entries such as "hard-working" and rating bars like "Excel 80%", which mean little to a reader and do not parse well.'),
        ],
      },
      {
        h: 'Mistakes to avoid',
        blocks: [
          ul(
            'Padding the resume with irrelevant school details from many years ago',
            'Using a heavy graphic template that hides a short history. A clean layout reads better.',
            'Typos. Read it aloud and ask someone else to check it.',
            'Exaggerating. Stay accurate, because interviewers will ask about everything on the page.',
            'Sending the same resume to every job. Adjust the summary and skills for each role.'
          ),
          p('Start with a single-column template in the RateYourCV builder, replace the sample details with yours, and check the result with the ATS Scanner against a real job post.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- ATS score */
  {
    slug: 'what-is-an-ats-score-and-how-to-improve-it',
    title: 'What Is an ATS Score? How It Works and How to Improve Yours',
    metaTitle: 'What Is an ATS Score and How to Improve It',
    excerpt:
      'An ATS score is a match estimate between your resume and a job description. Learn what it measures, what it does not tell you, and the practical steps that raise it honestly.',
    market: 'ATS Optimization',
    category: 'ATS & CV Strategy',
    ...NOV,
    highlights: [
      'What people mean by an "ATS score" and where the number comes from',
      'What resume checkers usually measure, and how ours is calculated',
      'Seven steps that improve the match without keyword stuffing',
      'What a high score does not guarantee',
    ],
    sections: [
      {
        h: 'What an ATS score is',
        blocks: [
          p('An applicant tracking system (ATS) is software that employers use to collect applications and let recruiters search them. An "ATS score" is a number, often shown as a percentage, that tells you how closely your resume matches a particular job description.'),
          p('The score is a convenient way to see where your resume is weak. It is not a pass mark. A higher number means your resume uses more of the job\'s language and is easier for software to read. It does not mean you will be hired, or even that a recruiter will see a score.'),
        ],
      },
      {
        h: 'Do employers really use a score?',
        blocks: [
          p('It depends on the employer and the software, and the vendors do not publish exact rules. What is generally reported:'),
          ul(
            'Many systems mainly store your application and let recruiters search and filter by keywords, job titles, skills and dates.',
            'Some systems include a match or ranking feature that sorts applicants against the job requirements. Employers choose whether to use it.',
            'Many recruiters still read the resume themselves, especially once it reaches a shortlist.'
          ),
          p('The scores you see on resume checkers, including the one in RateYourCV, are the checker\'s own estimate. They are not numbers copied from an employer\'s system, and different tools give different scores for the same resume. Use the number to compare versions of your own resume against one job, not as a prediction.'),
        ],
      },
      {
        h: 'What a resume checker usually measures',
        blocks: [
          p('Tools differ, but most look at the same few things:'),
          ul(
            'Skills and keywords: how many of the job\'s required skills and terms appear in your resume',
            'Job title and experience: whether your titles and years of experience fit the role',
            'Structure: standard section headings such as Summary, Skills, Experience and Education',
            'Readability: plain text that can be read in the right order, without tables, text boxes or images carrying key information',
            'Contact details: name, email and phone where a parser can find them'
          ),
          p('In the RateYourCV ATS Scanner, the match estimate combines five parts: hard skills (35%), keyword coverage (20%), soft skills (15%), experience level (15%) and formatting checks (15%). It is a transparent estimate for improving your resume, not an official score from any employer or ATS vendor.'),
        ],
      },
      {
        h: 'How to improve your score: 7 steps',
        blocks: [
          ol(
            'Start from a real job description. A score only means something against one specific job, so paste the posting you are applying for.',
            'List the missing skills. Look at the required skills and tools the checker says are missing. Mark the ones you genuinely have.',
            'Add them where they belong. Put real skills in your Skills section and work them into bullet points that show how you used them.',
            'Use the employer\'s wording. If the job says "stakeholder management" and your resume says "working with clients", use the job\'s phrase where it is accurate. Include both an acronym and its full name once, such as "Search Engine Optimization (SEO)".',
            'Match your title and summary. Name the target role in your headline or summary, and keep your real job titles unchanged.',
            'Fix the structure. Use a single-column layout, standard headings, consistent dates and real text. Avoid tables, icons, skill bars and text boxes.',
            'Add numbers to your bullets where you honestly can: how many, how much, how fast. Replace vague duties with results.'
          ),
          ex('Helped customers with account problems.', 'Resolved 40+ account issues a week for enterprise customers, keeping response time under 2 hours by creating reusable reply templates.'),
          tip('Re-run the check after each round of edits. Stop when the missing items that remain are skills you do not have. Adding those would raise the number but not your chances.'),
        ],
      },
      {
        h: 'What not to do',
        blocks: [
          ul(
            'Do not paste the job description into your resume in white text or hide keywords. Parsers can expose hidden text, and recruiters who see it may reject you.',
            'Do not list skills you do not have. You may pass a keyword search and then fail the interview, or lose the job later.',
            'Do not repeat the same keyword many times to raise the count. It reads badly to a human and does not help a good system.',
            'Do not chase 100%. A resume that matches every term is usually a sign of stuffing, and the last few points are rarely worth the effort.'
          ),
        ],
      },
      {
        h: 'What a high score does not mean',
        blocks: [
          p('A good score does not tell you whether the employer will invite you to interview. It does not measure your seniority, the quality of your achievements, whether you meet the legal or visa requirements, or how many other people applied.'),
          p('Think of it as a spell-check for relevance. It catches obvious gaps, such as a missing tool or a layout that scrambles when it is read by software. After that, what matters is whether a person reading your resume sees clear evidence that you can do the job.'),
        ],
      },
      {
        h: 'A quick routine you can repeat for every application',
        blocks: [
          ol(
            'Paste the job description into the ATS Scanner with your current resume.',
            'Read the missing skills and formatting notes.',
            'Open the builder, apply the suggestions that are true for you, and add numbers to your bullets.',
            'Run the scan again, then download the PDF.',
            'Save that version with the job\'s name so you can reuse it for similar roles.'
          ),
          p('See the guide on how to tailor your resume to a job description for the full process, and the ATS resume checklist for formatting rules.'),
        ],
      },
    ],
  },
];

export const careerGuides: CareerGuide[] = raw.map((g) => ({
  ...g,
  readingTime: minutes(g.sections),
}));
