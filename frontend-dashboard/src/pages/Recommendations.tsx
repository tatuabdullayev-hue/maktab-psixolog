import '../rec.css';

interface Program {
  name: string;
  source: string;
  desc: string;
}

interface Action {
  icon: string;
  title: string;
  detail: string;
}

interface Section {
  level: 'danger' | 'attention';
  label: string;
  labelColor: string;
  labelBg: string;
  borderColor: string;
  headBg: string;
  intro: string;
  actions: Action[];
  programs: Program[];
  warning?: string;
}

const SECTIONS: Section[] = [
  {
    level: 'danger',
    label: 'HIGH RISK GROUP',
    labelColor: '#dc2626',
    labelBg: '#fee2e2',
    borderColor: '#dc2626',
    headBg: 'linear-gradient(135deg,#fef2f2 0%,#fff5f5 100%)',
    intro:
      'Global research (WHO, APA, UNODC) shows that students in the high-risk group are 3–5 times more likely to engage in delinquent or deviant behavior without prompt, multi-layered psychological support. The following interventions are evidence-based.',
    warning: 'Counseling alone is not sufficient for this group — individualized attention and regular monitoring are mandatory for every student.',
    actions: [
      {
        icon: '🧠',
        title: 'Multisystemic Therapy (MST)',
        detail:
          'Recognized globally as the #1 method for crime prevention (Henggeler, 1998). Works simultaneously with the child, family, school, and peers. 3–5 sessions per week over 3–5 months. Reduces recidivism by 25–70%.',
      },
      {
        icon: '👨‍👩‍👧',
        title: 'Mandatory Family Meeting',
        detail:
          '60–70% of a student\'s behavior is linked to the home environment (Farrington, 2003). Parents are invited to discuss risk factors, family dynamics, and supervision levels. Psychological support is also recommended for parents.',
      },
      {
        icon: '📋',
        title: 'Cognitive Behavioral Therapy (CBT)',
        detail:
          'Validated in 40+ countries (Meta-analysis: Lipsey, 2009). Targets aggression, impulsivity, and distorted thinking patterns. 12–16 individual or group sessions. Reduces violence and antisocial behavior by 30–50%.',
      },
      {
        icon: '🎯',
        title: 'Individual Mentor (Big Brother/Big Sister Model)',
        detail:
          'The BBBS program (USA, Canada) pairs each high-risk student with a positive adult role model. 4 hours per week. Drug use down 46%, violence down 32% (Tierney & Grossman, 1995).',
      },
      {
        icon: '🚨',
        title: 'Coordination with Class Teacher and Community Inspector',
        detail:
          'Therapy is ineffective if the student\'s school, home, and community environments are not monitored together. The psychologist, class teacher, and community inspector must share information at least once a month.',
      },
      {
        icon: '📊',
        title: 'Monthly Progress Monitoring',
        detail:
          'Monthly re-assessment using SDQ, Buss-Perry, or psychologist observation to track behavioral change. If no improvement — increase intervention intensity or refer to a specialized institution.',
      },
    ],
    programs: [
      {
        name: 'Multisystemic Therapy (MST)',
        source: 'Henggeler et al., 1998 · APA Division 53',
        desc: 'Reduces criminal recidivism by 25–70%. Applied in 50+ countries.',
      },
      {
        name: 'Functional Family Therapy (FFT)',
        source: 'Alexander & Parsons, 1973 · OJJDP Approved',
        desc: 'Restores family relationship patterns. 60% of youth do not reoffend.',
      },
      {
        name: 'Aggression Replacement Training (ART)',
        source: 'Goldstein, 1987 · Used in 30 countries',
        desc: 'Aggression, moral reasoning, and social skills — 3-block course, 10 weeks.',
      },
      {
        name: 'Positive Behavioral Interventions (PBIS)',
        source: 'OSEP Technical Assistance Center, USA',
        desc: 'Full restructuring of the school environment. Reduces discipline problems by 60%.',
      },
    ],
  },
  {
    level: 'attention',
    label: 'MEDIUM RISK GROUP',
    labelColor: '#d97706',
    labelBg: '#fef3c7',
    borderColor: '#f59e0b',
    headBg: 'linear-gradient(135deg,#fffbeb 0%,#fefce8 100%)',
    intro:
      'Students in the medium-risk group have not yet escalated to high risk — this is the most effective window for intervention. Research (Catalano & Hawkins, 1996) shows that the right approach at this stage can reduce the probability of escalation by up to 70%.',
    actions: [
      {
        icon: '💬',
        title: 'Group Social Skills Training',
        detail:
          'Peer relationships, peaceful conflict resolution, emotional regulation. Once a week, 45 minutes, for 8–12 weeks. Based on programs such as PATHS and Second Step (Durlak, 2011).',
      },
      {
        icon: '📚',
        title: 'Additional Academic Support',
        detail:
          'Academic difficulties are often the root cause of deviant behavior (Maguin & Loeber, 1996). Extra math and language classes or a tutor. Result: improved academic performance and behavior.',
      },
      {
        icon: '🌱',
        title: 'Engagement in Positive Activities',
        detail:
          'Sports, art, music, volunteering — structuring free time. Unstructured free time is the primary driver of connection with deviant peer groups (Osgood, 1999). Each student should participate in at least one extracurricular activity per week.',
      },
      {
        icon: '👀',
        title: 'Peer Group Monitoring',
        detail:
          'Who a student associates with is the most critical risk factor (Dishion & Dodge, 2005). If a student joins an antisocial peer group, medium risk can escalate to high risk within 6 months. Regular information exchange with the class teacher is essential.',
      },
      {
        icon: '🤝',
        title: 'Parent Strengthening (Parenting Programs)',
        detail:
          'Teaching parents positive discipline techniques based on Incredible Years, Triple P, etc. Parenting training improves children\'s behavior by 40% (Webster-Stratton, 2001).',
      },
      {
        icon: '📅',
        title: 'Quarterly Psychological Assessment',
        detail:
          'Status is reviewed every 3 months using the SDQ or a similar tool. If no improvement — escalate to high-risk intervention. If improved — monitoring continues.',
      },
    ],
    programs: [
      {
        name: 'Second Step (Social-Emotional Learning)',
        source: 'Committee for Children · 70+ countries',
        desc: 'Social-emotional skills. Reduces aggressive behavior by 46%.',
      },
      {
        name: 'PATHS (Promoting Alternative Thinking Strategies)',
        source: 'Greenberg & Kusche, 1993 · Blueprints Model',
        desc: 'Emotional regulation and problem-solving skills in school settings.',
      },
      {
        name: 'Life Skills Training (LST)',
        source: 'Botvin, 1984 · NIDA Approved',
        desc: 'Resistance to drugs, violence, and peer pressure. 75% effectiveness rate.',
      },
      {
        name: 'Triple P (Positive Parenting Program)',
        source: 'Sanders, 1999 · 25 countries',
        desc: 'For parents. Reduces children\'s behavioral problems by 30–40%.',
      },
    ],
  },
];

export function Recommendations() {
  return (
    <div className="dashboard">
      <div className="topbar">
        <h1 className="topbar__title">Recommendations</h1>
        <p className="rec-subtitle">
          Early prevention of delinquency and deviant behavior — evidence-based practices
        </p>
      </div>

      {/* Kirish bloki */}
      <div className="rec-intro-card">
        <div className="rec-intro-icon">🌍</div>
        <div>
          <h3 className="rec-intro-title">An Approach Based on Global Evidence</h3>
          <p className="rec-intro-text">
            The following recommendations are based on programs validated by WHO, UNODC, APA,
            and the Blueprints for Healthy Youth Development database. Each recommendation is
            supported by at least one randomized controlled trial (RCT).
          </p>
          <div className="rec-intro-sources">
            <span className="rec-source-chip">WHO 2023</span>
            <span className="rec-source-chip">UNODC Youth Crime Prevention</span>
            <span className="rec-source-chip">APA Division 53</span>
            <span className="rec-source-chip">Blueprints Model Programs</span>
            <span className="rec-source-chip">OJJDP Evidence-Based</span>
          </div>
        </div>
      </div>

      {SECTIONS.map(sec => (
        <div
          key={sec.level}
          className="rec-section"
          style={{ borderColor: sec.borderColor }}
        >
          {/* Sarlavha */}
          <div className="rec-section__head" style={{ background: sec.headBg }}>
            <span
              className="rec-section__badge"
              style={{ background: sec.labelBg, color: sec.labelColor, borderColor: sec.borderColor }}
            >
              {sec.level === 'danger' ? '🔴' : '🟡'} {sec.label}
            </span>
            <p className="rec-section__intro">{sec.intro}</p>
            {sec.warning && (
              <div className="rec-warning" style={{ borderColor: sec.borderColor, color: sec.labelColor }}>
                ⚠️ {sec.warning}
              </div>
            )}
          </div>

          {/* Amaliy tavsiyalar */}
          <div className="rec-section__body">
            <h3 className="rec-group-title">Practical Interventions</h3>
            <div className="rec-actions-grid">
              {sec.actions.map((a, i) => (
                <div
                  key={i}
                  className="rec-action-card"
                  style={{ borderTopColor: sec.borderColor }}
                >
                  <div className="rec-action-card__icon">{a.icon}</div>
                  <div className="rec-action-card__title">{a.title}</div>
                  <div className="rec-action-card__detail">{a.detail}</div>
                </div>
              ))}
            </div>

            {/* Dasturlar */}
            <h3 className="rec-group-title" style={{ marginTop: 28 }}>
              Evidence-Based Programs
            </h3>
            <div className="rec-programs-list">
              {sec.programs.map((p, i) => (
                <div key={i} className="rec-program-row">
                  <div className="rec-program-row__dot" style={{ background: sec.labelColor }} />
                  <div className="rec-program-row__body">
                    <span className="rec-program-row__name">{p.name}</span>
                    <span className="rec-program-row__source">{p.source}</span>
                    <span className="rec-program-row__desc">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Umumiy xulosa */}
      <div className="rec-conclusion">
        <div className="rec-conclusion__icon">📌</div>
        <div>
          <h3>Note</h3>
          <p>
            No program or recommendation delivers full results when applied only once.
            Consistency, family involvement, and school-psychologist-community collaboration
            are the key conditions for success. In severe cases, referral to a specialized
            clinical psychologist or psychiatrist is necessary.
          </p>
        </div>
      </div>
    </div>
  );
}
