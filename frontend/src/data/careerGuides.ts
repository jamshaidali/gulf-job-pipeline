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
    title: 'The 2026 ATS Resume Checklist: What Actually Goes Wrong',
    metaTitle: 'ATS Resume Checklist for 2026',
    excerpt:
      'Most resume problems with applicant tracking systems come from a handful of layout and wording choices. A short checklist of what to fix before you hit submit.',
    market: 'ATS Optimization',
    category: 'ATS & CV Strategy',
    ...NOV,
    highlights: [
      'How a parser reads a resume, and where it trips',
      'The copy-paste test that takes 30 seconds',
      'Keyword choices that help and the ones that backfire',
      'When a designer template is still the right call',
    ],
    sections: [
      {
        h: 'How a parser reads your file',
        blocks: [
          p('When you upload a resume, the employer\'s system tries to turn it into a record: name, phone, employers, job titles, dates, skills. It reads the text from top to bottom, left to right, and guesses what each chunk is from its position and its heading.'),
          p('That guess is where things break. Put your phone number in a page header and some systems never see it. Split your page into two columns and the reader may stitch a line from the left column onto a line from the right, so your job title ends up glued to a skill. None of this is dramatic, and none of it is certain. It just means a layout that looks great to you can arrive as a jumble.'),
          p('Vendors do not publish exact parsing rules, so what follows is the cautious version: the choices that most often cause trouble, according to recruiters and career-site writers, and that are cheap to avoid.'),
        ],
      },
      {
        h: 'The 30-second copy-paste test',
        blocks: [
          p('Open your PDF, select everything, paste it into a plain text editor. Read what you get.'),
          ul(
            'Is your name first, then contact details?',
            'Does each job show title, company and dates together?',
            'Do the sections come out in the order you expect?',
            'Are there stray symbols, broken words or missing lines?'
          ),
          p('If the pasted text is a mess, fix the layout. If it reads cleanly, you have removed the most common cause of trouble.'),
        ],
      },
      {
        h: 'Layout choices that cause the most trouble',
        blocks: [
          ul(
            'Columns and sidebars. A single column reads in one direction and has nothing to get tangled.',
            'Tables and text boxes used for layout. The text sits inside a container some parsers skip.',
            'Contact details in the page header or footer.',
            'Information carried by an icon, a skill bar or a picture: "Python ●●●●○" tells software nothing.',
            'Scanned or image-based PDFs. If you cannot select the text, a parser cannot read it either.'
          ),
          p('Fonts are the least of your worries. Arial, Calibri, Cambria and Times all work. Use 10 to 12 pt and do not shrink the type to squeeze onto one page.'),
        ],
      },
      {
        h: 'Headings: boring on purpose',
        blocks: [
          p('"Summary", "Skills", "Experience", "Education". A heading like "My Story" or "Where I\'ve Been" is charming to a person and meaningless to a parser looking for the work history. Save the personality for the content under the heading.'),
          p('Dates matter too. Pick one format ("Mar 2022 – Present") and use it everywhere. Mixed formats ("03/22", "March \'22", "2022-") are easy for a person to read and easy for software to misread.'),
        ],
      },
      {
        h: 'Keywords: borrow the employer\'s words, truthfully',
        blocks: [
          p('Recruiters search by the terms in the posting. If the job asks for "stakeholder management" and your resume says "worked with different departments", you might not turn up in that search, even though you do the same work.'),
          p('Read the posting once, note the terms it repeats, and check which of them describe things you really do. Use the employer\'s wording for those. Write an acronym and its full name once each ("Applicant Tracking System (ATS)"), since people search both ways.'),
          p('What backfires: copying the whole posting, hiding keywords in white text, or listing tools you have never touched. A hidden-text trick can be exposed the moment someone selects all, and a skill you cannot discuss in the interview costs you the interview.'),
        ],
      },
      {
        h: 'When a designer template is still fine',
        blocks: [
          p('A resume with a coloured sidebar and a photo is a good choice when you are sending it to a person: a founder, a friend\'s manager, a recruiter on LinkedIn. For a large employer\'s online application form, send the plain single-column version. Keep both. Naming them "Name-Resume-Designer.pdf" and "Name-Resume-Plain.pdf" saves you from sending the wrong one.'),
        ],
      },
      {
        h: 'Before you apply',
        blocks: [
          ol(
            'Copy-paste test passes.',
            'Name and contact details sit in the body of the page.',
            'Headings are standard, dates are consistent, newest role first.',
            'Skills from this specific posting appear, only where true.',
            'File name is plain, and the format matches what the employer asked for.'
          ),
          p('The RateYourCV ATS Scanner checks several of these automatically and lists the keywords your resume is missing for a given posting.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Software engineer */
  {
    slug: 'software-ai-engineer-resume-guide',
    title: 'Software and AI Engineer Resumes: What to Show and What to Cut',
    metaTitle: 'Software Engineer Resume Guide (2026)',
    excerpt:
      'A practical guide to writing a software, cloud or AI engineer resume: how to describe real work, how to organise skills, and what to leave off.',
    market: 'Engineering & AI',
    category: 'Tech Resumes',
    ...NOV,
    highlights: [
      'The structure most engineering resumes use',
      'Bullets for backend, frontend and data or AI roles',
      'How to present side projects and open source',
      'What to cut when the resume runs long',
    ],
    sections: [
      {
        h: 'Two readers, two jobs',
        blocks: [
          p('The first reader, usually a recruiter, is checking for a match: right languages, right level, right location. The second, an engineer or hiring manager, wants to know whether you built something real and what you did.'),
          p('A list of technologies satisfies the first reader and leaves the second cold. Every claim in your skills list should have a bullet somewhere that proves it.'),
        ],
      },
      {
        h: 'A structure that works',
        blocks: [
          p('Name and links (GitHub, LinkedIn, portfolio) at the top. Then a two-line summary, a skills block, experience, projects, education. Put projects above experience only if you are a student or have under a year of work behind you.'),
          p('One page is plenty for under five years of experience. Two pages is normal after that. Longer than two and something has gone wrong, usually a role from ten years ago described in detail.'),
        ],
      },
      {
        h: 'Group the skills block',
        blocks: [
          p('Think about what you would want to scan. Something like this beats one long comma list:'),
          ul(
            'Languages: Python, TypeScript, SQL',
            'Backend: FastAPI, Django, REST, PostgreSQL, Redis',
            'Infrastructure: Docker, AWS, Terraform, GitHub Actions'
          ),
          p('Leave out what you have only read about. If a posting asks for Kubernetes and you have used it once in a tutorial, you can say so in the interview. Do not put it next to the tools you ship with.'),
        ],
      },
      {
        h: 'Bullets that say what happened',
        blocks: [
          p('A good engineering bullet names the thing you built, the tools, and something that changed. The change can be a number, but it does not have to be.'),
          ex('Worked on the checkout service.', 'Rewrote the checkout totals calculation in Go to remove a rounding bug that was producing refund disputes, and added tests that now run on every pull request.'),
          ex('Used Python and ML for analytics.', 'Trained a gradient-boosted model in scikit-learn to flag churn-risk accounts, which the support team now uses to prioritise outreach each week.'),
          ex('Responsible for the React frontend.', 'Moved the dashboard from client-side rendering to server-rendered pages, which cut the first screen on slow connections from a blank page to readable content in under two seconds on our test devices.'),
          p('Every example above is invented to show the shape. Use your own details, and use numbers only when you measured them.'),
        ],
      },
      {
        h: 'Projects and open source',
        blocks: [
          p('Include a link. A project with a repository and a working demo is worth more than three lines describing it. Say what problem it solves and what you chose to build it with. If you contributed to someone else\'s project, name the project and say what your change did.'),
          p('If a project is half-finished, you can still list it. Describe what exists, not what you plan.'),
        ],
      },
      {
        h: 'What to cut',
        blocks: [
          ul(
            'Every technology you have ever installed',
            'Duties that every person in the role does ("attended stand-ups")',
            'Soft-skill adjectives with no example',
            'A photo, a date of birth, a full home address'
          ),
          p('Then tailor. Move the skills and bullets that match the posting to the top. The guide on tailoring a resume to a job description shows how.'),
        ],
      },
      {
        h: 'Special cases',
        blocks: [
          p('Bootcamp graduate or self-taught: lead with projects, link the code, and describe what each does. Employers care that you can build things, and a well-explained project says that louder than a course name.'),
          p('Changing from another field: say what carries over. Five years in finance operations plus a data-engineering certificate is a story. Put the new skills first, and keep the earlier job in a sentence or two of context.'),
          p('Machine learning roles: name the problem, the data and the metric you improved, and say how the model was used. "Trained a classifier" says little. "Trained a classifier that the support team uses to route tickets" says what it was for.'),
        ],
      },
      {
        h: 'Questions engineers ask',
        blocks: [
          p('How many projects should I list? Two or three that you can speak about in depth. More dilutes the strong ones.'),
          p('Should I include a GitHub link if it looks empty? Link it only if the pinned repositories show something worth seeing. Tidy it first, or leave it off.'),
          p('Do I need a degree on the resume? List the one you have. If you do not have one, leave out the education block or show courses and certifications instead, and let the work carry you.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Executive */
  {
    slug: 'executive-product-leadership-resume-blueprint',
    title: 'Executive and Product Leadership Resumes: Show Scope, Not Tasks',
    metaTitle: 'Executive & Product Leader Resume Guide',
    excerpt:
      'Senior resumes get read by people who already assume you can do the work. How to show the size of what you ran and what changed because of it.',
    market: 'Executive & Product',
    category: 'Leadership Strategy',
    ...NOV,
    highlights: [
      'A summary built around scope',
      'Which numbers carry weight at senior level',
      'How to keep a long career readable',
      'Length and layout for executive search and online forms',
    ],
    sections: [
      {
        h: 'The reader already assumes you can do the job',
        blocks: [
          p('For a director or VP role, nobody doubts you know how to run a meeting. They want to know the size of the situation you were in and how you changed it: the team, the budget, the product, the market.'),
          p('So the question to ask of every line is "what did this look like from outside my team?". A bullet about writing a roadmap says little. A bullet about how a roadmap shifted the company\'s focus says more.'),
        ],
      },
      {
        h: 'Open with scope',
        blocks: [
          p('Your summary should place you within three lines: function, years, size, and what you are known for.'),
          ex('Results-focused leader seeking a senior role.', 'Product leader with 12 years in B2B software. Ran a 40-person product and design group across three business lines, with responsibility for roadmap, pricing and the quarterly planning process.'),
          p('If a number is confidential, say it differently: "the second-largest revenue line in the company" tells a reader plenty without giving a figure away.'),
        ],
      },
      {
        h: 'Numbers worth including',
        blocks: [
          p('Pick the ones that match the job. A COO role cares about cost and cycle time. A growth role cares about acquisition and retention. A product role cares about adoption and revenue.'),
          ul(
            'Revenue or growth you were accountable for, and your part in it',
            'Cost taken out, or time taken off a process',
            'Headcount you managed, hired and developed',
            'Customer outcomes: retention, expansion, satisfaction',
            'Budget, regions or product lines under your control'
          ),
          p('Claim what you did. "Led the team that launched X" and "owned the decision to retire Y" are honest and specific. "Drove growth" is not.'),
        ],
      },
      {
        h: 'A long career in two pages',
        blocks: [
          p('Give the last ten to fifteen years full detail and older roles a line each. Cut anything a reader would assume. Move board seats, publications and speaking to a short block at the end.'),
          p('Use a plain single-column layout. Executive search firms and online application systems both handle it well, and a template that is easy to read is not a handicap at this level.'),
        ],
      },
      {
        h: 'Tailor the top third',
        blocks: [
          p('The top third of page one is what gets read first. Change it for each application so the summary and your first few achievements line up with what the posting emphasises. The ATS Scanner shows which of the posting\'s terms your resume does not mention.'),
        ],
      },
      {
        h: 'Two bullets, compared',
        blocks: [
          p('These are invented to show the difference between activity and scope.'),
          ex('Managed the product team and worked on the roadmap.', 'Led 14 product managers across three business lines and rebuilt the planning process around a quarterly portfolio review, which let the executive team stop two low-return projects and move that staffing to the checkout rebuild.'),
          p('The second version tells a reader the size of the team, the decision you owned, and what changed. The first could describe almost anyone.'),
        ],
      },
      {
        h: 'Mistakes that make senior resumes weaker',
        blocks: [
          ul(
            'Listing every responsibility instead of choosing the three or four that mattered',
            'Using the same bullets for every role over twelve years',
            'Leaving off dates or scope for earlier jobs, which makes readers suspicious',
            'Overusing adjectives like "visionary" and "transformational" with nothing to back them',
            'A design so heavy that it hides the content'
          ),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Tailor to JD */
  {
    slug: 'how-to-tailor-your-resume-to-a-job-description',
    title: 'How to Tailor Your Resume to a Job Description, With a Worked Example',
    metaTitle: 'How to Tailor Your Resume to a Job',
    excerpt:
      'Tailoring means choosing which true things to put first and describing them in the employer\'s language. A step-by-step method with a worked example.',
    market: 'Job Applications',
    category: 'Resume Writing',
    ...NOV,
    highlights: [
      'Why a master resume saves time',
      'How to read a posting for what matters',
      'A worked example: one job post, three edits',
      'Where to stop',
    ],
    sections: [
      {
        h: 'Start with a master resume',
        blocks: [
          p('Keep one long document with every job, project, skill and result you have, written out in full. You will never send it. For each application you copy it and cut it down. Cutting is quicker than writing from scratch, and you stop forgetting achievements you had in your head last year.'),
        ],
      },
      {
        h: 'Reading the posting',
        blocks: [
          p('Postings are written in a rush and then lightly edited by a committee, so the order of the requirements often shows what mattered to the person who wrote it. The first three or four requirements are usually the ones that decide who gets a call.'),
          p('Underline the repeated terms and the specific tools. Note anything that appears in the title, the first paragraph and the requirements: it is the core of the role.'),
        ],
      },
      {
        h: 'A worked example',
        blocks: [
          p('Take this made-up posting for a Customer Success Associate: "onboard new accounts, track renewals, report on customer health, Zendesk and Salesforce, 2+ years in SaaS." And this made-up resume line: "Answered customer emails and chats about billing and login problems."'),
          p('Three edits tailor it without changing a single fact about what happened:'),
          ol(
            'The headline moves from "Support Specialist" to "Support Specialist, SaaS customer onboarding and renewals" because the person did handle new accounts and renewal questions.',
            'The bullet becomes: "Handled new-account setup and billing questions for SaaS customers in Zendesk, including renewal queries." The same work, now using the posting\'s words.',
            'The skills list adds "Salesforce" only because this person had used it in a previous team. If they had not, it would stay off.'
          ),
          p('Notice what did not change: dates, employer, title and the amount of work. Tailoring is a rewrite of emphasis, not a rewrite of history.'),
        ],
      },
      {
        h: 'What to leave alone',
        blocks: [
          p('Dates, employers, job titles and qualifications get checked, and a mismatch ends an application. Numbers should stay your real numbers. Skills you do not have do not belong, however many times the posting repeats them.'),
          p('A good test: could you talk about this line for two minutes? If not, take it out.'),
        ],
      },
      {
        h: 'Speeding it up',
        blocks: [
          p('Paste the posting and your resume into the RateYourCV ATS Scanner. It lists the posting\'s skills you have not mentioned and suggests changes. Read each suggestion and accept only the ones that are true for you, then open the builder to make the edits.'),
        ],
      },
      {
        h: 'How much tailoring is enough',
        blocks: [
          p('Fifteen to twenty minutes per application is a sensible budget for jobs you really want. Spend it on the summary, the skills list and the first two bullets of your most recent role, since those are read first and weigh most.'),
          p('For a job you are lukewarm about, a ten-minute pass on the headline and skills is enough. If you find yourself rewriting every bullet, you may be applying to a role that is a stretch, and your time might be better spent on a better-fitting posting.'),
        ],
      },
      {
        h: 'A second example, for an engineering posting',
        blocks: [
          p('A posting asks for "experience building APIs with FastAPI and PostgreSQL, deployed on AWS". Your resume says "built backend services for internal tools". You did use FastAPI and PostgreSQL there, and the services ran on AWS.'),
          ex('Built backend services for internal tools.', 'Built backend APIs in FastAPI and PostgreSQL for internal tools, deployed on AWS and used daily by three teams.'),
          p('Nothing was added that was not true. The bullet now answers the posting in the posting\'s own terms, and a keyword search for FastAPI would now find it.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Summary */
  {
    slug: 'how-to-write-a-resume-summary',
    title: 'How to Write a Resume Summary That Gets Read',
    metaTitle: 'How to Write a Resume Summary',
    excerpt:
      'A resume summary is two to four lines that tell the reader who you are and why you fit the job. A simple method, several examples, and the phrases to drop.',
    market: 'Resume Writing',
    category: 'Examples',
    ...NOV,
    highlights: [
      'When a summary helps and when to skip it',
      'A fill-in-the-blank method',
      'Examples for three different situations',
      'A quick test for whether yours is specific enough',
    ],
    sections: [
      {
        h: 'Do you need one?',
        blocks: [
          p('If you have a few years of experience, yes. The summary is the first thing under your name, so it gets read when nothing else does. If you are a student with no work history, a short objective is better, or no summary at all, with your education and projects doing the talking.'),
        ],
      },
      {
        h: 'A fill-in-the-blank method',
        blocks: [
          p('Write one sentence for each blank:'),
          ol(
            '[Job title or field] with [number] years of experience in [area].',
            'Strongest at [two or three skills that match this job].',
            'One real thing you did, or the kind of work you do.'
          ),
          p('Then read it as if you knew nothing about the writer. Could it describe a thousand other people? If so, it needs a detail.'),
        ],
      },
      {
        h: 'Three situations',
        blocks: [
          p('These are illustrations. Replace every detail with your own.'),
          ex('Hard-working professional seeking a position with growth opportunities.', 'Customer support lead with six years in SaaS, managing a team of eight and handling escalated enterprise accounts. Strong in onboarding and process documentation.'),
          ex('Recent graduate looking for a first role.', 'Computer science graduate with an internship building REST APIs in Python and Django. Comfortable with SQL, Git and testing. Built a project tracker that thirty classmates used during their final year.'),
          ex('Experienced worker moving into a new field.', 'Operations coordinator moving into data analysis. Five years of reporting and process work, plus a completed SQL and Excel course. Built weekly dashboards that replaced three manual reports.'),
        ],
      },
      {
        h: 'Phrases to drop',
        blocks: [
          p('"Hard-working", "team player", "passionate", "results-driven": they appear on a great many resumes, so they separate nobody. Drop first-person pronouns too. "Led a team of five" is cleaner than "I led a team of five".'),
          p('Stay at four lines or fewer. If it wraps past that, the extra lines belong in your experience section.'),
        ],
      },
      {
        h: 'Write it last',
        blocks: [
          p('Finish the rest of the resume first. Once you can see your strongest bullets together, the two or three things worth putting in the summary are obvious. Then adjust it for each job: the same person might open with analytics for one application and with campaign management for another.'),
        ],
      },
      {
        h: 'Summary, objective or headline?',
        blocks: [
          p('They overlap, and people mix them up. A summary describes what you have already done. An objective says what you want next, which suits students and career changers. A headline is the single line under your name, such as "Backend developer, Python and AWS", and it is often the most useful line on the page because recruiters scan it first.'),
          p('You can have a headline and a short summary together. Most people only need the headline plus two lines.'),
        ],
      },
      {
        h: 'A test for whether yours is specific enough',
        blocks: [
          p('Cover your name and read the summary aloud to someone. Ask them: could this be a nurse, a marketer or a developer? If they cannot tell, the summary is too general.'),
          p('Next, look for words you could cross out without losing meaning. "Highly motivated professional with a proven track record" survives deletion as "professional", which is nothing. Replace it with the job, the years, and one fact.'),
          ex('Dynamic, detail-oriented finance professional with a proven track record.', 'Accounts payable analyst with five years in manufacturing. Cleared a six-week invoice backlog and set up the monthly close checklist the team still uses.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Tailor already; ATS score */
  {
    slug: 'what-is-an-ats-score-and-how-to-improve-it',
    title: 'What Is an ATS Score? What It Measures and How to Raise It Honestly',
    metaTitle: 'What Is an ATS Score and How to Improve It',
    excerpt:
      'An ATS score is a checker\'s estimate of how well your resume matches one job. What it measures, where it falls short, and a worked example that went from 30% to 68%.',
    market: 'ATS Optimization',
    category: 'ATS & CV Strategy',
    ...NOV,
    highlights: [
      'What the number is, and what it is not',
      'How RateYourCV calculates its match estimate',
      'A worked example with real before-and-after numbers',
      'Where this kind of score misleads',
    ],
    sections: [
      {
        h: 'What the number is',
        blocks: [
          p('An applicant tracking system, or ATS, is the software an employer uses to collect applications and let recruiters search them. When someone talks about an "ATS score", they usually mean the percentage a resume checker shows after comparing your resume with a job posting.'),
          p('That percentage comes from the checker, not from the employer. Whether a particular company\'s system produces any score at all depends on the software and on how the employer configured it. Many recruiters search by keyword and read the resumes themselves. Treat the number as a quick way to see where your resume is thin, not as a verdict.'),
        ],
      },
      {
        h: 'How our estimate is calculated',
        blocks: [
          p('The RateYourCV ATS Scanner combines five parts. Hard skills count for 35%, keyword coverage for 20%, soft skills 15%, experience level 15%, and a formatting check 15%. The result is limited to a range of 20 to 98, since a literal 0% or 100% would claim more than a text comparison can know.'),
          p('One limit you should know about: the hard-skills part checks against a built-in list of technical skills such as programming languages, cloud tools and databases. For software roles it is informative. For a role like customer success or marketing, that part has little to match, and keyword coverage tells you more.'),
        ],
      },
      {
        h: 'A worked example',
        blocks: [
          p('We ran the scanner on a made-up resume against a made-up backend developer posting that asked for Python, FastAPI, AWS, PostgreSQL, Docker and automated testing. The first version listed Python, Django, MySQL and Git, with short, general bullets. It scored 30%.'),
          p('The edits were small and all truthful for the invented person: add FastAPI, PostgreSQL, Docker, AWS and CI/CD to the skills list because the bullets now described using them, and rewrite the bullets to say what was built and with which tools. Same person, same jobs. The score went to 68%.'),
          p('The skills section went from 14% to 85% on matching. Soft skills stayed at 0% because the posting mentioned communication and teamwork and the resume never did. That is a good reminder that a score shows what a text comparison can see, and a missing word is not a missing quality.'),
          p('This example is invented to show how the tool behaves. Your numbers will differ with your resume and the posting.'),
        ],
      },
      {
        h: 'Raising the number without cheating',
        blocks: [
          p('Work from the missing list. For each skill the checker says is absent, ask: do I really have this? If yes, put it where it belongs: in the skills list, and in a bullet that shows you used it. If no, leave it out and move on.'),
          p('Then look at structure. Single column, normal headings, one date format. Then look at your bullets and add real numbers where you have them.'),
        ],
      },
      {
        h: 'Where this kind of score misleads',
        blocks: [
          ul(
            'It cannot tell whether your achievements are impressive, only whether the words appear.',
            'It knows nothing about visa rules, location, salary expectations or how many people applied.',
            'Two tools give two different numbers for the same resume, so compare versions inside one tool.',
            'Chasing 100% leads to stuffing. A resume that echoes every term in the posting reads oddly to a person.'
          ),
          p('Hidden white-text keywords deserve a separate warning. Select all, and they show up. Do not use them.'),
        ],
      },
      {
        h: 'A routine you can reuse',
        blocks: [
          p('Scan with the posting pasted in, read the missing list, edit what is true, scan again, then download. Save each version under the job\'s name. The next similar application starts from a tailored version, not from zero.'),
          p('The guides on tailoring a resume and on the ATS checklist cover the steps in more detail.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- XYZ */
  {
    slug: 'resume-bullet-points-xyz-formula',
    title: 'Resume Bullet Points: Turning Duties Into Results With the X-Y-Z Formula',
    metaTitle: 'Resume Bullet Points: The X-Y-Z Formula',
    excerpt:
      'The X-Y-Z formula, popularised by former Google people-operations head Laszlo Bock, turns "responsible for" into something a reader can picture. How to use it, and what to do without numbers.',
    market: 'Resume Writing',
    category: 'Examples',
    ...NOV,
    highlights: [
      'The formula, in one sentence',
      'Before-and-after bullets across different jobs',
      'Ways to be specific when you have no numbers',
      'How many bullets a role needs',
    ],
    sections: [
      {
        h: 'The formula in one sentence',
        blocks: [
          p('Laszlo Bock, who ran people operations at Google, suggested writing each resume bullet as: "Accomplished [X], as measured by [Y], by doing [Z]." X is the result you wanted. Y is how you know. Z is what you actually did.'),
          p('The point is not the grammar. It is that a duty ("responsible for reports") tells the reader what your job description said, while a result tells them what you did.'),
        ],
      },
      {
        h: 'Before and after',
        blocks: [
          ex('Responsible for social media accounts.', 'Grew Instagram followers from 4,000 to 9,500 in six months by posting short videos three times a week and answering every comment.'),
          ex('Handled customer complaints.', 'Resolved about 40 customer complaints a week with a 95% satisfaction rating by building a library of reply templates and escalating urgent cases the same day.'),
          ex('Worked on website speed.', 'Cut homepage load time from 4.2 seconds to 1.8 by compressing images and loading below-the-fold content later.'),
          p('These examples are invented. The shape is what matters; the figures must come from your work.'),
        ],
      },
      {
        h: 'When you have no numbers',
        blocks: [
          p('Plenty of good work does not come with a metric, and making one up is worse than leaving it out. You can still be specific.'),
          ul(
            'Scale: how many people, accounts, shifts, orders or tickets you handled',
            'Frequency: every day, every release, once a month',
            'Before and after: what replaced a manual process, or what other teams started using',
            'Outcome without a figure: an audit passed, a complaint closed, a client kept'
          ),
          p('If you are unsure of a number, ask: your old manager, a report you saved, a dashboard. And only keep a figure you can explain in an interview.'),
        ],
      },
      {
        h: 'Starting verbs',
        blocks: [
          p('Start with a past-tense verb for finished roles and present tense for your current one. Mix them up: built, cut, led, rebuilt, trained, negotiated, automated. Five bullets that all begin with "Managed" read as if you did one thing.'),
        ],
      },
      {
        h: 'How many bullets',
        blocks: [
          p('Three to five for recent roles, one or two for older ones. Put the result most relevant to the job first. If a bullet does not help you get this job, cut it.'),
          p('In the RateYourCV builder, the AI Quantify button does not invent figures. It adds a fill-in-the-blank, "[add result: X% / $Y / time saved]", and leaves the real number to you.'),
        ],
      },
      {
        h: 'Common slip-ups',
        blocks: [
          ul(
            '"Various", "many" and "several": give a count or leave it out',
            'Claiming team results as personal ones. Say "contributed to" or "as part of a team of six" when that is the truth.',
            'Starting with "Responsible for", which describes the role and not what you did',
            'Mixing tenses within one role',
            'Burying the result at the end of a long sentence; lead with it when you can'
          ),
        ],
      },
      {
        h: 'The same idea in different jobs',
        blocks: [
          p('The formula is not only for technical work. A few invented illustrations:'),
          ex('Taught maths to year 9.', 'Raised the share of year-9 students passing the end-of-term test from 62% to 78% by adding weekly low-stakes quizzes and one-to-one catch-up sessions.'),
          ex('Worked on the hospital ward.', 'Managed a rota of 12 nurses across three shifts and reduced last-minute cover requests by planning leave two months ahead.'),
          ex('Handled invoices.', 'Processed about 300 supplier invoices a month and cut the average payment delay from 12 days to 5 by sorting urgent ones first and flagging missing paperwork the same day.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- Resume vs CV */
  {
    slug: 'resume-vs-cv-difference',
    title: 'Resume vs CV: Which Word Means What, and Where',
    metaTitle: 'Resume vs CV: What Is the Difference?',
    excerpt:
      'In some countries a resume and a CV are the same document; in others they are not. What the words usually mean in the US, the UK, the Gulf and South Asia, and how to avoid sending the wrong one.',
    market: 'Resume Basics',
    category: 'Resume Basics',
    ...NOV,
    highlights: [
      'The short answer: it depends where you apply',
      'When a CV means a long academic record',
      'What to do when the posting does not say',
      'Photos and personal details by region, with caveats',
    ],
    sections: [
      {
        h: 'It depends on the country',
        blocks: [
          p('Ask five people for the difference between a resume and a CV and you will get several answers, because the words are used differently around the world. There is no universal rule, so what follows are tendencies, not laws.'),
        ],
      },
      {
        h: 'Usual meanings by region',
        blocks: [
          ul(
            'United States and Canada: a resume is a short, tailored summary of one to two pages. A CV is a long, complete record of an academic career, with publications, grants and teaching, used for research and some medical roles.',
            'United Kingdom, Ireland, much of Europe, Australia and New Zealand: "CV" is the ordinary word for the document you send with a job application, usually about two pages.',
            'India, Pakistan and the Gulf: "CV" is the common word for the standard job application document. Details such as a photo or personal information vary by employer.'
          ),
          p('If a posting asks for one and you send the other, you will almost always be understood. The more important thing is length and relevance.'),
        ],
      },
      {
        h: 'Academic CVs',
        blocks: [
          p('If you are applying for a lectureship, a research post or a PhD, a CV of several pages is expected. It lists publications, conference talks, grants, teaching experience and sometimes supervision. This is the case where "CV" really is a different document from a resume.'),
        ],
      },
      {
        h: 'Photos and personal details',
        blocks: [
          p('In the US and UK, photos and details such as age and marital status are generally left off, partly to reduce bias. In some other places, photos are more common. Rules and expectations change, and employers differ within a country, so follow the posting. If it asks for a photo, include one. If it says not to, leave it out.'),
          p('RateYourCV\'s single-column templates have no photo. Its designer templates have an optional one.'),
        ],
      },
      {
        h: 'When the posting does not say',
        blocks: [
          p('Send a one-to-two-page, single-column document with standard headings, newest job first. It works nearly everywhere. If you are applying to a region you do not know well, look at a few postings from employers there, or ask someone who works in that market.'),
        ],
      },
      {
        h: 'PDF or Word?',
        blocks: [
          p('Send what the employer asks for. If the application says nothing, PDF keeps your layout intact, and a PDF made from a word processor or a builder contains selectable text that software can read. Word suits employers or recruiters who want to edit your document. Having both ready is easy with the RateYourCV builder, which exports either.'),
        ],
      },
      {
        h: 'Common questions',
        blocks: [
          p('Does CV mean "longer"? Only for academic CVs. For a normal job application, the same one-to-two page rule applies to both words.'),
          p('Should I use a different version for each country? Often a little. The core is the same. The differences are in small details: whether to include a photo, how to write dates, whether to list nationality or a work permit status, and whether to use US or UK spelling. Check a few local postings or ask someone who has been through that market.'),
          p('Do I need a cover letter? Some employers ask for one and many do not. If a posting asks, write a short one. If it says nothing, a good resume is the priority.'),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- No experience */
  {
    slug: 'resume-with-no-experience',
    title: 'A Resume With No Work Experience: A Guide for Students and Freshers',
    metaTitle: 'Resume With No Experience: Student Guide',
    excerpt:
      'Everything you need to build a first resume from education, projects, volunteering and skills, including how to write bullets for work that was not a job.',
    market: 'Early Career',
    category: 'Resume Writing',
    ...NOV,
    highlights: [
      'What counts as experience when you have no job',
      'The order that makes a short history look solid',
      'How to describe a project or a society role',
      'Things to leave off a first resume',
    ],
    sections: [
      {
        h: 'You have more to show than you think',
        blocks: [
          p('Employers who hire graduates know there is no long work history to read. What they look for is evidence you can learn, finish something and work with other people. That evidence is scattered across your life: a final-year project, a part-time job, a society you ran, a course you completed on your own.'),
        ],
      },
      {
        h: 'What to put in, and in what order',
        blocks: [
          ol(
            'Name, email, phone, city, and a link to LinkedIn or a portfolio.',
            'One or two lines on the kind of role you want and your main skills.',
            'Education: degree, institution, dates, and any coursework that matches the job.',
            'Projects or work, whichever is stronger.',
            'Skills, only ones you can show.',
            'Volunteering, certifications and activities.'
          ),
          p('One page. Leave out a photo and personal details unless the posting asks for them.'),
        ],
      },
      {
        h: 'Writing bullets for things that were not jobs',
        blocks: [
          p('Treat a project like a job: say what you built, with what, and what happened.'),
          ex('Did a final-year project on a website.', 'Built a booking website in React and Node.js for my final-year project, with login, search and email confirmations, and tested it with 15 classmates.'),
          ex('Member of the debating society.', 'Organised weekly practice for 25 members and ran a three-university tournament over one weekend.'),
          p('Use your own numbers: a count of people, hours a week, or the size of an audience is enough to make a line concrete. The examples above are invented.'),
        ],
      },
      {
        h: 'Skills: honest and visible',
        blocks: [
          p('List tools and languages you have actually used, and soft skills only where a bullet shows them. Skip skill bars and percentages such as "Excel 80%": they mean nothing to the reader and do not come through when software reads the file.'),
          p('If a posting mentions a tool you have not used but could learn quickly, you can mention a related one you have used. Do not list it as a skill.'),
        ],
      },
      {
        h: 'What to leave off',
        blocks: [
          ul(
            'School achievements from many years ago, unless they are remarkable',
            'Long lists of hobbies; a single relevant one is fine',
            'Vague claims about being hard-working',
            'Anything you could not explain in an interview'
          ),
          p('Start from a single-column template in the RateYourCV builder, replace the sample text with yours, and run the ATS Scanner against a real posting to see what is missing.'),
        ],
      },
      {
        h: 'What a full first resume looks like',
        blocks: [
          p('A typical shape for a recent computer science graduate: a headline ("Computer science graduate, Python and web development"), two lines on what you are looking for, education with the final-year project named, two projects with links and two bullets each, a skills block, and one line on volunteering or an activity.'),
          p('Everything sits on one page, in one column, in a clear font. Nothing is stretched. A short resume with real content beats a padded one.'),
        ],
      },
      {
        h: 'Questions fresh graduates ask',
        blocks: [
          p('Should I include my grades? If they are strong and the employer is likely to care, yes. If not, leave them out unless the posting asks.'),
          p('Do I list references? Not on the resume. "References available on request" takes up space and tells the reader nothing new.'),
          p('What about a gap between graduating and now? Say what you did: freelancing, a course, caring for family, a project. A short honest line is better than a blank.'),
          p('Is an internship experience? Yes, treat it like a job: title, company, dates and two or three bullets about what you did.'),
        ],
      },
    ],
  },
];

export const careerGuides: CareerGuide[] = raw.map((g) => ({
  ...g,
  readingTime: minutes(g.sections),
}));
