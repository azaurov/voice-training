export const PROMPTS = {
  interview: [
    {
      id: 'i1',
      title: 'Tell me about yourself',
      text: 'Tell me about yourself and your professional background.',
      tip: 'Use the Present-Past-Future structure: who you are now, how you got here, where you want to go.',
      duration: 90
    },
    {
      id: 'i2',
      title: 'Greatest strength',
      text: 'What is your greatest professional strength and how have you applied it?',
      tip: 'Pick a strength directly relevant to the role. Back it with a specific example using STAR format.',
      duration: 60
    },
    {
      id: 'i3',
      title: 'Greatest weakness',
      text: 'What is your greatest weakness and what are you doing to address it?',
      tip: "Choose a real weakness, not a disguised strength. Show self-awareness and genuine steps you're taking.",
      duration: 60
    },
    {
      id: 'i4',
      title: 'Why this company',
      text: 'Why do you want to work here and what excites you about this opportunity?',
      tip: 'Research the company beforehand. Connect their mission or recent work to your own goals.',
      duration: 75
    },
    {
      id: 'i5',
      title: 'Conflict at work',
      text: 'Describe a time when you had a conflict with a colleague. How did you handle it?',
      tip: 'Use STAR. Focus on resolution and what you learned — avoid blaming others.',
      duration: 90
    },
    {
      id: 'i6',
      title: 'Biggest achievement',
      text: 'Tell me about your greatest professional achievement.',
      tip: 'Quantify the impact whenever possible — numbers, percentages, time saved.',
      duration: 90
    },
    {
      id: 'i7',
      title: 'Where do you see yourself in 5 years',
      text: 'Where do you see yourself in 5 years?',
      tip: 'Be honest but practical. Align your aspirations with realistic growth in this role.',
      duration: 60
    },
    {
      id: 'i8',
      title: 'Why are you leaving',
      text: 'Why are you leaving your current position?',
      tip: "Stay positive. Focus on what you're moving toward, not what you're escaping.",
      duration: 60
    },
    {
      id: 'i9',
      title: 'Pressure and deadlines',
      text: 'How do you handle pressure and tight deadlines?',
      tip: 'Give a concrete example. Describe your system — prioritization, communication, focus.',
      duration: 75
    },
    {
      id: 'i10',
      title: 'Questions for us',
      text: 'Do you have any questions for us?',
      tip: "Always ask 2-3 thoughtful questions. About the team, the role's challenges, or success metrics.",
      duration: 60
    }
  ],
  speaking: [
    {
      id: 's1',
      title: 'Introduce yourself to a crowd',
      text: 'You have just been introduced at a networking event of 50 people. Give a 60-second introduction of who you are and what you do.',
      tip: 'Lead with what you do, not your title. End with something memorable or a hook for conversation.',
      duration: 60
    },
    {
      id: 's2',
      title: 'Explain your work to a non-expert',
      text: 'Explain what you do professionally to someone who has never heard of your field. Make it engaging and jargon-free.',
      tip: "Use an analogy. Avoid acronyms. Gauge your listener's reaction and adjust pace.",
      duration: 90
    },
    {
      id: 's3',
      title: 'Persuade the room',
      text: 'Pitch one idea you believe in strongly. Persuade your audience to agree with you or take a specific action.',
      tip: 'Open with a problem. Offer your solution. Close with a clear call to action.',
      duration: 120
    },
    {
      id: 's4',
      title: 'Storytelling',
      text: 'Tell a story from your life that taught you an important lesson. Make it vivid and personal.',
      tip: 'Set the scene quickly. Build tension before the turning point. Deliver the lesson at the end.',
      duration: 120
    },
    {
      id: 's5',
      title: 'Handle a tough question',
      text: 'Imagine an audience member challenges your view directly: "You\'re wrong about that — here\'s why." Respond calmly and confidently.',
      tip: 'Acknowledge their point first. Then reframe with evidence. Stay composed — body language matters.',
      duration: 60
    },
    {
      id: 's6',
      title: 'Impromptu 2-minute talk',
      text: 'Pick any topic you know well and speak about it for two minutes without preparation.',
      tip: "Use PREP: Point, Reason, Example, Point. Start strong, don't trail off at the end.",
      duration: 120
    },
    {
      id: 's7',
      title: 'Project update to stakeholders',
      text: 'Give a 90-second project status update. Cover current progress, blockers, and next steps.',
      tip: 'Lead with status (on track / at risk). Be concise about blockers. End with a clear ask if you need something.',
      duration: 90
    },
    {
      id: 's8',
      title: 'Opening hook',
      text: "Open a presentation on a topic of your choice with a compelling hook that grabs the audience's attention immediately.",
      tip: 'Try a surprising statistic, a rhetorical question, or a short story. Avoid "Today I will talk about..."',
      duration: 60
    }
  ],
  reading: [
    {
      id: 'r1',
      title: 'The Gettysburg Address (excerpt)',
      text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.',
      tip: 'Pace yourself — aim for 120-150 words per minute. Pause at commas and periods.',
      duration: 60
    },
    {
      id: 'r2',
      title: 'Business writing clarity',
      text: 'Our team has completed the initial phase of the project ahead of schedule. We identified three critical bottlenecks during testing and resolved them without impacting the delivery timeline. The next phase begins Monday. I will send a detailed report by end of day Friday and welcome any questions in the meantime.',
      tip: 'Speak with authority — short sentences signal confidence. Don\'t rush through punctuation.',
      duration: 45
    },
    {
      id: 'r3',
      title: 'Technical explanation',
      text: 'Machine learning models learn patterns from data rather than following explicitly programmed rules. During training, the model adjusts its internal parameters to minimize the difference between its predictions and the correct answers. Once trained, it can apply those learned patterns to new, unseen data.',
      tip: 'Slow down on technical terms. Use slight emphasis on key nouns to help listeners follow along.',
      duration: 60
    },
    {
      id: 'r4',
      title: 'Inspirational passage',
      text: 'Success is not final, failure is not fatal: it is the courage to continue that counts. Every setback you face is not a wall — it is a step. The world does not reward perfection; it rewards persistence. Show up every day, do the work, and trust that the effort compounds.',
      tip: 'Vary your pace — slow on the most important lines. Let pauses do the work of emphasis.',
      duration: 45
    }
  ]
};

export const CATEGORY_META = {
  interview: { label: 'Interview Prep',    icon: '💼', desc: 'Practice common behavioral and situational questions' },
  speaking:  { label: 'Public Speaking',   icon: '🎤', desc: 'Improve delivery, persuasion, and impromptu skills' },
  reading:   { label: 'Reading Aloud',     icon: '📖', desc: 'Train pacing, clarity, and vocal presence' }
};
