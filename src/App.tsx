import React, { useState, useMemo } from 'react';
import { Moon, Sun, Sparkles, Calendar, Heart, Zap, Brain, Flame, Droplet, ArrowRight, User, MapPin, Clock, AlertCircle, TrendingDown, Activity, Link, FileText, CheckCircle, RefreshCw } from 'lucide-react';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const julianDay = (date) => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;
  let yy = y, mm = m;
  if (mm <= 2) { yy -= 1; mm += 12; }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
};

const norm360 = (x) => ((x % 360) + 360) % 360;

const sunLongitude = (jd) => {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = (357.52911 + 35999.05029 * T) * DEG;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  return norm360(L0 + C);
};

const moonLongitude = (jd) => {
  const T = (jd - 2451545.0) / 36525;
  const L = 218.3164477 + 481267.88123421 * T;
  const D = (297.8501921 + 445267.1114034 * T) * DEG;
  const M = (357.5291092 + 35999.0502909 * T) * DEG;
  const Mp = (134.9633964 + 477198.8675055 * T) * DEG;
  const F = (93.2720950 + 483202.0175233 * T) * DEG;
  const lon = L + 6.289 * Math.sin(Mp) - 1.274 * Math.sin(Mp - 2 * D) + 0.658 * Math.sin(2 * D)
    - 0.186 * Math.sin(M) - 0.059 * Math.sin(2 * Mp - 2 * D) - 0.057 * Math.sin(Mp - 2 * D + M)
    + 0.053 * Math.sin(Mp + 2 * D) + 0.046 * Math.sin(2 * D - M) + 0.041 * Math.sin(Mp - M);
  return norm360(lon);
};

// Obliquity of the ecliptic
const obliquity = (jd) => {
  const T = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * T;
};

// Greenwich Mean Sidereal Time in degrees
const gmst = (jd) => {
  const T = (jd - 2451545.0) / 36525;
  let theta = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  return norm360(theta);
};

// Local Sidereal Time in degrees
const lst = (jd, longitude) => norm360(gmst(jd) + longitude);

// Ascendant calculation
const ascendant = (jd, latitude, longitude) => {
  const lstDeg = lst(jd, longitude);
  const ramc = lstDeg * DEG;
  const eps = obliquity(jd) * DEG;
  const lat = latitude * DEG;
  // Standard ascendant formula
  const asc = Math.atan2(
    -Math.cos(ramc),
    Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)
  ) * RAD;
  return norm360(asc);
};

// Midheaven (MC) calculation
const midheaven = (jd, longitude) => {
  const lstDeg = lst(jd, longitude);
  const ramc = lstDeg * DEG;
  const eps = obliquity(jd) * DEG;
  const mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * RAD;
  return norm360(mc);
};

const RISING_TRAITS = {
  'Aries':{vibe:'Direct, bold, first-mover energy',presence:'You come across as confident, quick, assertive. People feel your drive before they know your name.',style:'Sharp, athletic, minimal fuss'},
  'Taurus':{vibe:'Grounded, sensual, unhurried',presence:'You register as steady and reliable. People trust your presence and your aesthetic sense.',style:'Tactile, quality-first, earthy luxe'},
  'Gemini':{vibe:'Quick, curious, conversational',presence:'You seem witty, versatile, plugged-in. People expect you to know things and connect dots.',style:'Playful, layered, eclectic'},
  'Cancer':{vibe:'Warm, protective, emotionally tuned',presence:'You come across as caring and intuitive. People open up around you without meaning to.',style:'Soft, nostalgic, home-coded'},
  'Leo':{vibe:'Magnetic, generous, performative',presence:'You enter a room. People notice, remember, and want to be near you.',style:'Statement, dramatic, gold-forward'},
  'Virgo':{vibe:'Precise, observant, quietly capable',presence:'You come across as sharp and put-together. People trust you to handle the detail.',style:'Tailored, clean, considered'},
  'Libra':{vibe:'Charming, balanced, aesthetic',presence:'You seem effortlessly likable. People find you diplomatic and easy to be with.',style:'Elegant, symmetrical, refined'},
  'Scorpio':{vibe:'Intense, magnetic, unreadable',presence:'You register as powerful and mysterious. People feel your gaze and remember it.',style:'Monochrome, sharp, understated power'},
  'Sagittarius':{vibe:'Expansive, frank, adventure-ready',presence:'You come across as optimistic and worldly. People expect you to have stories and strong opinions.',style:'Bold, global, casual-confident'},
  'Capricorn': { vibe: 'Serious, authoritative, built-to-last', presence: 'You register as competent and mature. People assume you\'re in charge even when you\'re not.', style: 'Classic, structured, investment pieces' },
  'Aquarius':{vibe:'Distinct, detached, future-coded',presence:'You come across as original and hard to pin down. People find you interesting and slightly aloof.',style:'Unconventional, conceptual, avant-edge'},
  'Pisces':{vibe:'Dreamy, fluid, emotionally porous',presence:'You seem soft, intuitive, otherworldly. People feel understood around you.',style:'Flowing, ethereal, watercolor palette'},
};

const CITIES = [
  {n:'Bandar Seri Begawan',c:'Brunei',lat:4.9031,lon:114.9398},
  {n:'Kuala Belait',c:'Brunei',lat:4.5833,lon:114.2333},
  {n:'Seria',c:'Brunei',lat:4.6083,lon:114.3250},
  {n:'Tutong',c:'Brunei',lat:4.8033,lon:114.6589},
  {n:'Kuala Lumpur',c:'Malaysia',lat:3.1390,lon:101.6869},
  {n:'Johor Bahru',c:'Malaysia',lat:1.4927,lon:103.7414},
  {n:'Kota Kinabalu',c:'Malaysia',lat:5.9804,lon:116.0735},
  {n:'Kuching',c:'Malaysia',lat:1.5535,lon:110.3593},
  {n:'Miri',c:'Malaysia',lat:4.3995,lon:113.9914},
  {n:'Penang',c:'Malaysia',lat:5.4164,lon:100.3327},
  {n:'Ipoh',c:'Malaysia',lat:4.5975,lon:101.0901},
  {n:'Singapore',c:'Singapore',lat:1.3521,lon:103.8198},
  {n:'Jakarta',c:'Indonesia',lat:-6.2088,lon:106.8456},
  {n:'Surabaya',c:'Indonesia',lat:-7.2575,lon:112.7521},
  {n:'Bandung',c:'Indonesia',lat:-6.9175,lon:107.6191},
  {n:'Medan',c:'Indonesia',lat:3.5952,lon:98.6722},
  {n:'Denpasar',c:'Indonesia',lat:-8.6705,lon:115.2126},
  {n:'Manila',c:'Philippines',lat:14.5995,lon:120.9842},
  {n:'Cebu',c:'Philippines',lat:10.3157,lon:123.8854},
  {n:'Davao',c:'Philippines',lat:7.1907,lon:125.4553},
  {n:'Bangkok',c:'Thailand',lat:13.7563,lon:100.5018},
  {n:'Chiang Mai',c:'Thailand',lat:18.7883,lon:98.9853},
  {n:'Phuket',c:'Thailand',lat:7.8804,lon:98.3923},
  {n:'Ho Chi Minh City',c:'Vietnam',lat:10.8231,lon:106.6297},
  {n:'Hanoi',c:'Vietnam',lat:21.0285,lon:105.8542},
  {n:'Tokyo',c:'Japan',lat:35.6762,lon:139.6503},
  {n:'Osaka',c:'Japan',lat:34.6937,lon:135.5023},
  {n:'Seoul',c:'South Korea',lat:37.5665,lon:126.9780},
  {n:'Busan',c:'South Korea',lat:35.1796,lon:129.0756},
  {n:'Beijing',c:'China',lat:39.9042,lon:116.4074},
  {n:'Shanghai',c:'China',lat:31.2304,lon:121.4737},
  {n:'Hong Kong',c:'Hong Kong',lat:22.3193,lon:114.1694},
  {n:'Taipei',c:'Taiwan',lat:25.0330,lon:121.5654},
  {n:'Mumbai',c:'India',lat:19.0760,lon:72.8777},
  {n:'Delhi',c:'India',lat:28.7041,lon:77.1025},
  {n:'Bangalore',c:'India',lat:12.9716,lon:77.5946},
  {n:'Chennai',c:'India',lat:13.0827,lon:80.2707},
  {n:'Kolkata',c:'India',lat:22.5726,lon:88.3639},
  {n:'Karachi',c:'Pakistan',lat:24.8607,lon:67.0011},
  {n:'Dhaka',c:'Bangladesh',lat:23.8103,lon:90.4125},
  {n:'Colombo',c:'Sri Lanka',lat:6.9271,lon:79.8612},
  {n:'Dubai',c:'UAE',lat:25.2048,lon:55.2708},
  {n:'Abu Dhabi',c:'UAE',lat:24.4539,lon:54.3773},
  {n:'Doha',c:'Qatar',lat:25.2854,lon:51.5310},
  {n:'Riyadh',c:'Saudi Arabia',lat:24.7136,lon:46.6753},
  {n:'Jeddah',c:'Saudi Arabia',lat:21.4858,lon:39.1925},
  {n:'Istanbul',c:'Turkey',lat:41.0082,lon:28.9784},
  {n:'Tehran',c:'Iran',lat:35.6892,lon:51.3890},
  {n:'Sydney',c:'Australia',lat:-33.8688,lon:151.2093},
  {n:'Melbourne',c:'Australia',lat:-37.8136,lon:144.9631},
  {n:'Brisbane',c:'Australia',lat:-27.4698,lon:153.0251},
  {n:'Perth',c:'Australia',lat:-31.9505,lon:115.8605},
  {n:'Auckland',c:'New Zealand',lat:-36.8485,lon:174.7633},
  {n:'Wellington',c:'New Zealand',lat:-41.2865,lon:174.7762},
  {n:'London',c:'United Kingdom',lat:51.5074,lon:-0.1278},
  {n:'Manchester',c:'United Kingdom',lat:53.4808,lon:-2.2426},
  {n:'Edinburgh',c:'United Kingdom',lat:55.9533,lon:-3.1883},
  {n:'Dublin',c:'Ireland',lat:53.3498,lon:-6.2603},
  {n:'Paris',c:'France',lat:48.8566,lon:2.3522},
  {n:'Berlin',c:'Germany',lat:52.5200,lon:13.4050},
  {n:'Munich',c:'Germany',lat:48.1351,lon:11.5820},
  {n:'Amsterdam',c:'Netherlands',lat:52.3676,lon:4.9041},
  {n:'Brussels',c:'Belgium',lat:50.8503,lon:4.3517},
  {n:'Madrid',c:'Spain',lat:40.4168,lon:-3.7038},
  {n:'Barcelona',c:'Spain',lat:41.3851,lon:2.1734},
  {n:'Rome',c:'Italy',lat:41.9028,lon:12.4964},
  {n:'Milan',c:'Italy',lat:45.4642,lon:9.1900},
  {n:'Zurich',c:'Switzerland',lat:47.3769,lon:8.5417},
  {n:'Vienna',c:'Austria',lat:48.2082,lon:16.3738},
  {n:'Stockholm',c:'Sweden',lat:59.3293,lon:18.0686},
  {n:'Oslo',c:'Norway',lat:59.9139,lon:10.7522},
  {n:'Copenhagen',c:'Denmark',lat:55.6761,lon:12.5683},
  {n:'Helsinki',c:'Finland',lat:60.1699,lon:24.9384},
  {n:'Warsaw',c:'Poland',lat:52.2297,lon:21.0122},
  {n:'Prague',c:'Czechia',lat:50.0755,lon:14.4378},
  {n:'Lisbon',c:'Portugal',lat:38.7223,lon:-9.1393},
  {n:'Athens',c:'Greece',lat:37.9838,lon:23.7275},
  {n:'Moscow',c:'Russia',lat:55.7558,lon:37.6173},
  {n:'Cairo',c:'Egypt',lat:30.0444,lon:31.2357},
  {n:'Lagos',c:'Nigeria',lat:6.5244,lon:3.3792},
  {n:'Nairobi',c:'Kenya',lat:-1.2921,lon:36.8219},
  {n:'Johannesburg',c:'South Africa',lat:-26.2041,lon:28.0473},
  {n:'Cape Town',c:'South Africa',lat:-33.9249,lon:18.4241},
  {n:'Casablanca',c:'Morocco',lat:33.5731,lon:-7.5898},
  {n:'New York',c:'USA',lat:40.7128,lon:-74.0060},
  {n:'Los Angeles',c:'USA',lat:34.0522,lon:-118.2437},
  {n:'San Francisco',c:'USA',lat:37.7749,lon:-122.4194},
  {n:'Chicago',c:'USA',lat:41.8781,lon:-87.6298},
  {n:'Houston',c:'USA',lat:29.7604,lon:-95.3698},
  {n:'Miami',c:'USA',lat:25.7617,lon:-80.1918},
  {n:'Seattle',c:'USA',lat:47.6062,lon:-122.3321},
  {n:'Boston',c:'USA',lat:42.3601,lon:-71.0589},
  {n:'Washington DC',c:'USA',lat:38.9072,lon:-77.0369},
  {n:'Toronto',c:'Canada',lat:43.6532,lon:-79.3832},
  {n:'Vancouver',c:'Canada',lat:49.2827,lon:-123.1207},
  {n:'Montreal',c:'Canada',lat:45.5017,lon:-73.5673},
  {n:'Mexico City',c:'Mexico',lat:19.4326,lon:-99.1332},
  {n:'Buenos Aires',c:'Argentina',lat:-34.6037,lon:-58.3816},
  {n:'São Paulo',c:'Brazil',lat:-23.5505,lon:-46.6333},
  {n:'Rio de Janeiro',c:'Brazil',lat:-22.9068,lon:-43.1729},
  {n:'Lima',c:'Peru',lat:-12.0464,lon:-77.0428},
  {n:'Bogotá',c:'Colombia',lat:4.7110,lon:-74.0721},
  {n:'Santiago',c:'Chile',lat:-33.4489,lon:-70.6693},
];

const planetLongitude = (jd, planet) => {
  const T = (jd - 2451545.0) / 36525;
  const elements = {
    mercury: { L: 252.250906, rate: 149472.6746358, e: 0.205635 },
    venus:   { L: 181.979801, rate: 58517.8156760,  e: 0.006773 },
    mars:    { L: 355.433000, rate: 19140.2993039,  e: 0.093405 },
    jupiter: { L: 34.351519,  rate: 3034.9056606,   e: 0.048498 },
    saturn:  { L: 50.077444,  rate: 1222.1138488,   e: 0.055546 },
  };
  const p = elements[planet];
  const M = norm360(p.L + p.rate * T) * DEG;
  const C = (2 * p.e - p.e ** 3 / 4) * Math.sin(M) + 1.25 * p.e ** 2 * Math.sin(2 * M);
  return norm360(p.L + p.rate * T + C * RAD);
};

const SIGNS = [
  {name:'Aries',symbol:'♈',element:'Fire',ruler:'Mars'},
  {name:'Taurus',symbol:'♉',element:'Earth',ruler:'Venus'},
  {name:'Gemini',symbol:'♊',element:'Air',ruler:'Mercury'},
  {name:'Cancer',symbol:'♋',element:'Water',ruler:'Moon'},
  {name:'Leo',symbol:'♌',element:'Fire',ruler:'Sun'},
  {name:'Virgo',symbol:'♍',element:'Earth',ruler:'Mercury'},
  {name:'Libra',symbol:'♎',element:'Air',ruler:'Venus'},
  {name:'Scorpio',symbol:'♏',element:'Water',ruler:'Pluto'},
  {name:'Sagittarius',symbol:'♐',element:'Fire',ruler:'Jupiter'},
  {name:'Capricorn',symbol:'♑',element:'Earth',ruler:'Saturn'},
  {name:'Aquarius',symbol:'♒',element:'Air',ruler:'Uranus'},
  {name:'Pisces',symbol:'♓',element:'Water',ruler:'Neptune'}
];

const getSign = (lon) => {
  const idx = Math.floor(lon / 30);
  return { ...SIGNS[idx], degree: lon % 30, index: idx, longitude: lon };
};

const lunarPhase = (jd) => {
  const sun = sunLongitude(jd);
  const moon = moonLongitude(jd);
  const diff = norm360(moon - sun);
  const illumination = (1 - Math.cos(diff * DEG)) / 2;
  let phase, emoji;
  if (diff < 22.5 || diff >= 337.5) { phase = 'New Moon'; emoji = '🌑'; }
  else if (diff < 67.5) { phase = 'Waxing Crescent'; emoji = '🌒'; }
  else if (diff < 112.5) { phase = 'First Quarter'; emoji = '🌓'; }
  else if (diff < 157.5) { phase = 'Waxing Gibbous'; emoji = '🌔'; }
  else if (diff < 202.5) { phase = 'Full Moon'; emoji = '🌕'; }
  else if (diff < 247.5) { phase = 'Waning Gibbous'; emoji = '🌖'; }
  else if (diff < 292.5) { phase = 'Last Quarter'; emoji = '🌗'; }
  else { phase = 'Waning Crescent'; emoji = '🌘'; }
  return { phase, emoji, illumination: Math.round(illumination * 100), angle: diff };
};

const LUNAR_GUIDANCE = {
  'New Moon':{e:'Intention-setting, planning, introspection',d:'Plan new projects, journal, set 28-day goals',a:'Big launches, hard decisions'},
  'Waxing Crescent':{e:'Building momentum, taking first steps',d:'Start new work, outreach, learning',a:'Impatience with slow progress'},
  'First Quarter':{e:'Decision-making, pushing through resistance',d:'Tackle obstacles, make commitments, execute',a:'Procrastination'},
  'Waxing Gibbous':{e:'Refinement, editing, course-correction',d:'Review, refine, prepare to launch',a:'Starting new threads'},
  'Full Moon':{e:'Peak visibility, culmination, launch',d:'Launch, present, celebrate, publish',a:'Avoiding conflict -- it surfaces now'},
  'Waning Gibbous':{e:'Sharing, teaching, gratitude',d:'Communicate wins, mentor, document',a:'Hoarding insights'},
  'Last Quarter': { energy: 'Release, forgiveness, letting go', do: 'Close loops, cut what isn\'t working', avoid: 'Holding onto dead weight' },
  'Waning Crescent':{e:'Rest, recovery, surrender',d:'Rest, reflect, restore',a:'Pushing hard -- honor the low'},
};

const ASPECTS = [
  {name:'Conjunction',angle:0,orb:8,symbol:'☌',nature:'fusion',color:'text-white'},
  {name:'Sextile',angle:60,orb:5,symbol:'⚹',nature:'harmonious',color:'text-emerald-300'},
  {name:'Square',angle:90,orb:7,symbol:'□',nature:'tension',color:'text-rose-300'},
  {name:'Trine',angle:120,orb:7,symbol:'△',nature:'flow',color:'text-sky-300'},
  {name:'Opposition',angle:180,orb:8,symbol:'☍',nature:'polarity',color:'text-amber-300'}
];

const PLANET_MEANING = {
  sun: 'identity & vitality',
  moon: 'emotions & needs',
  mercury: 'thinking & communication',
  venus: 'love & values',
  mars: 'drive & action',
  jupiter: 'growth & opportunity',
  saturn: 'structure & lessons',
};

const ASPECT_INTERPRETATIONS = {
  'Conjunction': (t, n) => `${t} energy fuses with your natal ${n} -- intensified focus on ${PLANET_MEANING[n]}.`,
  'Sextile':     (t, n) => `${t} opens gentle opportunity for your ${n} -- easy to act on ${PLANET_MEANING[n]}.`,
  'Square':      (t, n) => `${t} creates friction with your natal ${n} -- tension around ${PLANET_MEANING[n]}, but it forces growth.`,
  'Trine':       (t, n) => `${t} flows with your natal ${n} -- natural ease in ${PLANET_MEANING[n]}.`,
  'Opposition':  (t, n) => `${t} mirrors your natal ${n} -- awareness moment for ${PLANET_MEANING[n]}, seek balance.`,
};

const calculateAspects = (transits, natal) => {
  const aspects = [];
  const transitPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'];
  const natalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  for (const tp of transitPlanets) {
    for (const np of natalPlanets) {
      const diff = Math.abs(norm360(transits[tp].longitude - natal[np].longitude));
      const angle = Math.min(diff, 360 - diff);
      for (const asp of ASPECTS) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            transit: tp, natal: np, aspect: asp.name, symbol: asp.symbol,
            nature: asp.nature, color: asp.color, orb: orb.toFixed(2),
            exact: orb < 1, applying: angle < asp.angle,
            interpretation: ASPECT_INTERPRETATIONS[asp.name](tp.charAt(0).toUpperCase() + tp.slice(1), np),
          });
          break;
        }
      }
    }
  }
  return aspects.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb));
};

const getCyclePhase = (lastPeriod, cycleLength, periodLength, today, pmsSymptoms = {}) => {
  const daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
  const dayInCycle = (daysSince % cycleLength) + 1;
  const ovulationDay = cycleLength - 14;
  const pmsStart = cycleLength - 6; // Last ~6 days of luteal

  let phase, subPhase = null, icon, color, gradient, energy, focus, tasks, pmsActive = false, pmsDay = 0;

  if (dayInCycle <= periodLength) {
    phase = 'Menstrual'; icon = Droplet; color = 'rose'; gradient = 'from-rose-900 to-red-900';
    energy = 'Low -- inward, reflective';
    focus = 'Deep reflection, reviewing, intuitive insights';
    tasks = 'Review previous cycle, journal, low-stakes admin, strategic thinking alone';
  } else if (dayInCycle <= ovulationDay - 2) {
    phase = 'Follicular'; icon = Sparkles; color = 'emerald'; gradient = 'from-emerald-800 to-teal-900';
    energy = 'Rising -- curious, creative';
    focus = 'New projects, brainstorming, learning';
    tasks = 'Start new initiatives, plan quarters, creative work, pitch new ideas';
  } else if (dayInCycle <= ovulationDay + 2) {
    phase = 'Ovulatory'; icon = Flame; color = 'amber'; gradient = 'from-amber-700 to-orange-800';
    energy = 'Peak -- magnetic, communicative';
    focus = 'Presentations, negotiations, collaboration';
    tasks = 'Pitch meetings, public speaking, networking, investor calls, team launches';
  } else {
    phase = 'Luteal'; icon = Brain; color = 'violet';
    if (dayInCycle < pmsStart) {
      subPhase = 'Early Luteal';
      gradient = 'from-violet-800 to-purple-900';
      energy = 'Steady -- focused, productive';
      focus = 'Execution, deep work, organization';
      workout = 'Pilates, strength training, moderate cardio';
      nutrition = 'Complex carbs, B vitamins, magnesium';
      tasks = 'Detail work, editing, admin, ERP/systems work, documentation, deep focus blocks';
    } else {
      subPhase = 'Late Luteal / PMS';
      pmsActive = true;
      pmsDay = dayInCycle - pmsStart + 1;
      gradient = 'from-purple-900 to-slate-900';
      energy = 'Dropping -- sensitive, critical, fatigued';
      focus = 'Finishing, closing loops, protecting energy';
      workout = 'Gentle movement, walking, restorative yoga, reduce intensity';
      nutrition = 'Magnesium, calcium, B6, reduce caffeine/alcohol/sugar, stay hydrated';
      tasks = 'Finish open loops, avoid new commitments, limit high-stakes meetings, batch admin, say no more';
    }
  }

  return { phase, subPhase, icon, color, gradient, energy, focus, tasks, dayInCycle, cycleLength, ovulationDay, pmsActive, pmsDay, pmsStart };
};

const PMS_SYMPTOMS = [
  {key:'mood',label:'Mood swings',icon:'🌊'},
  {key:'anxiety',label:'Anxiety',icon:'😰'},
  {key:'irritability',label:'Irritability',icon:'⚡'},
  {key:'fatigue',label:'Fatigue',icon:'😴'},
  {key:'bloating',label:'Bloating',icon:'🫃'},
  {key:'cramps',label:'Cramps',icon:'🔥'},
  {key:'headache',label:'Headache',icon:'🤕'},
  {key:'breast',label:'Breast tenderness',icon:'💗'},
  {key:'cravings',label:'Food cravings',icon:'🍫'},
  {key:'brain_fog',label:'Brain fog',icon:'🌫️'},
  {key:'insomnia',label:'Sleep issues',icon:'🌙'},
  {key:'sensitive',label:'Emotional sensitivity',icon:'💧'}
];

const matchTaskToDay = (task, day) => {
  if (!day.cycle) return 50;
  let score = 50;
  const phaseKey = day.cycle.subPhase || day.cycle.phase;

  // Phase match
  if (task.idealPhase && task.idealPhase.includes(phaseKey)) score += 30;
  else if (task.idealPhase && task.idealPhase.includes(day.cycle.phase)) score += 20;

  // Intensity vs day score
  const dayCapacity = day.score / 20; // 0-5 scale
  const intensityGap = Math.abs(task.intensity - dayCapacity);
  score -= intensityGap * 8;

  // Hard blocks
  if (day.cycle.pmsActive && task.intensity >= 4) score -= 40;
  if (day.cycle.phase === 'Menstrual' && task.intensity >= 4) score -= 25;
  if (task.mode === 'visible' && day.cycle.pmsActive) score -= 30;
  if (task.mode === 'visible' && day.score < 40) score -= 15;

  // Boost high-visibility tasks on peak days
  if (task.mode === 'visible' && day.cycle.phase === 'Ovulatory') score += 15;

  return Math.max(0, Math.min(100, score));
};

export default function Dashboard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', dob: '', tob: '12:00', pob: '', pobLat: null, pobLon: null, gender: '',
    lastPeriod: '', cycleLength: 28, periodLength: 5, trackingCycle: true,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityList, setShowCityList] = useState(false);
  const [userTasks, setUserTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', intensity: 3, mode: 'solo' });
  const [plannerView, setPlannerView] = useState('connect');

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return CITIES.slice(0, 8);
    const q = citySearch.toLowerCase();
    return CITIES.filter(c => c.n.toLowerCase().includes(q) || c.c.toLowerCase().includes(q)).slice(0, 12);
  }, [citySearch]);
  const [pmsLog, setPmsLog] = useState({}); // { 'YYYY-MM-DD': { mood: 3, anxiety: 2, ... } }
  const [showPmsLog, setShowPmsLog] = useState(false);

  // Notion / task import state
  const [notionUrl, setNotionUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [notionLoading, setNotionLoading] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [fetchLabel, setFetchLabel] = useState('');
  const [notionError, setNotionError] = useState('');
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionSource, setNotionSource] = useState('');
  const [importedTasks, setImportedTasks] = useState([]);
  const [connectTab, setConnectTab] = useState('notion');

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  const natalChart = useMemo(() => {
    if (!data.dob) return null;
    const [y, m, d] = data.dob.split('-').map(Number);
    const [hh, mm] = data.tob.split(':').map(Number);
    const birthDate = new Date(Date.UTC(y, m - 1, d, hh, mm));
    const jd = julianDay(birthDate);
    const chart = {
      sun: getSign(sunLongitude(jd)), moon: getSign(moonLongitude(jd)),
      mercury: getSign(planetLongitude(jd, 'mercury')), venus: getSign(planetLongitude(jd, 'venus')),
      mars: getSign(planetLongitude(jd, 'mars')), jupiter: getSign(planetLongitude(jd, 'jupiter')),
      saturn: getSign(planetLongitude(jd, 'saturn')),
    };
    if (data.pobLat !== null && data.pobLon !== null) {
      chart.ascendant = getSign(ascendant(jd, data.pobLat, data.pobLon));
      chart.midheaven = getSign(midheaven(jd, data.pobLon));
    }
    return chart;
  }, [data.dob, data.tob, data.pobLat, data.pobLon]);

  const todayChart = useMemo(() => {
    const jd = julianDay(today);
    return {
      sun: getSign(sunLongitude(jd)), moon: getSign(moonLongitude(jd)),
      mercury: getSign(planetLongitude(jd, 'mercury')), venus: getSign(planetLongitude(jd, 'venus')),
      mars: getSign(planetLongitude(jd, 'mars')), lunar: lunarPhase(jd),
    };
  }, []);

  const aspects = useMemo(() => {
    if (!natalChart) return [];
    return calculateAspects(todayChart, natalChart);
  }, [natalChart, todayChart]);

  const cycle = useMemo(() => {
    if (!data.lastPeriod || !data.trackingCycle) return null;
    const parts = data.lastPeriod.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN) || parts[0] < 1900 || parts[1] < 1 || parts[2] < 1) return null;
    const [y, m, d] = parts;
    try { return getCyclePhase(new Date(y, m - 1, d), Number(data.cycleLength), Number(data.periodLength), today); }
    catch { return null; }
  }, [data.lastPeriod, data.cycleLength, data.periodLength, data.trackingCycle]);

  const pmsInsights = useMemo(() => {
    const entries = Object.entries(pmsLog);
    if (entries.length === 0) return null;
    const totals = {};
    entries.forEach(([, symptoms]) => {
      Object.entries(symptoms).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { top: sorted, totalDays: entries.length };
  }, [pmsLog]);

  const forecast = useMemo(() => {
    if (!natalChart) return [];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const jd = julianDay(d);
      const transits = {
        sun: getSign(sunLongitude(jd)),
        moon: getSign(moonLongitude(jd)),
        mercury: getSign(planetLongitude(jd, 'mercury')),
        venus: getSign(planetLongitude(jd, 'venus')),
        mars: getSign(planetLongitude(jd, 'mars')),
      };
      const lunar = lunarPhase(jd);
      const dayAspects = calculateAspects(transits, natalChart);
      let dayCycle = null;
      if (data.lastPeriod && data.trackingCycle) {
        const parts = data.lastPeriod.split('-').map(Number);
        if (parts.length === 3 && !parts.some(isNaN) && parts[0] >= 1900 && parts[1] >= 1 && parts[2] >= 1) {
          const [y, m, dd] = parts;
          try { dayCycle = getCyclePhase(new Date(y, m - 1, dd), Number(data.cycleLength), Number(data.periodLength), d); }
          catch { dayCycle = null; }
        }
      }
      // Score the day: harmonious aspects (+), tight hard aspects (-), cycle energy
      let score = 50;
      dayAspects.forEach(a => {
        const weight = a.exact ? 2 : 1;
        if (a.nature === 'flow' || a.nature === 'harmonious') score += 4 * weight;
        if (a.nature === 'tension' || a.nature === 'polarity') score -= 3 * weight;
        if (a.nature === 'fusion') score += 1 * weight;
      });
      if (dayCycle) {
        if (dayCycle.phase === 'Ovulatory') score += 15;
        else if (dayCycle.phase === 'Follicular') score += 10;
        else if (dayCycle.subPhase === 'Early Luteal') score += 5;
        else if (dayCycle.pmsActive) score -= 15;
        else if (dayCycle.phase === 'Menstrual') score -= 5;
      }
      score = Math.max(0, Math.min(100, score));

      const exactCount = dayAspects.filter(a => a.exact).length;
      const hardExact = dayAspects.filter(a => a.exact && (a.nature === 'tension' || a.nature === 'polarity')).length;
      const flowExact = dayAspects.filter(a => a.exact && (a.nature === 'flow' || a.nature === 'harmonious')).length;

      let verdict = 'steady';
      if (score >= 75) verdict = 'peak';
      else if (score >= 60) verdict = 'strong';
      else if (score >= 40) verdict = 'steady';
      else if (score >= 25) verdict = 'careful';
      else verdict = 'protect';

      days.push({ date: d, jd, transits, lunar, aspects: dayAspects, cycle: dayCycle, score, verdict, exactCount, hardExact, flowExact });
    }
    return days;
  }, [natalChart, data.lastPeriod, data.cycleLength, data.periodLength, data.trackingCycle]);

  // Task suggestions grouped per day -- uses only imported/manual userTasks
  const weekPlan = useMemo(() => {
    if (forecast.length === 0) return [];
    return forecast.map(day => {
      const dayKey = day.date.toISOString().split('T')[0];
      const isLow = day.cycle?.pmsActive || day.score < 35;

      // Surface best-fit tasks from userTasks for this day
      const scored = userTasks
        .map(task => ({ ...task, fit: matchTaskToDay(task, day) }))
        .sort((a, b) => b.fit - a.fit);

      // On low days, prefer low-intensity solo tasks
      const suggestions = isLow
        ? scored.filter(t => t.intensity <= 2 && t.mode === 'solo').slice(0, 3)
        : scored.filter(t => t.intensity >= 3 || t.mode !== 'solo').slice(0, 3);

      const assigned = userTasks.filter(t => t.assignedDay === dayKey);
      return { ...day, dayKey, suggestions, assigned, isLow };
    });
  }, [forecast, userTasks]);

  // Auto-assign a user task to the best fitting day
  const autoAssign = (task) => {
    if (weekPlan.length === 0) return null;
    const scores = weekPlan.map(day => ({ dayKey: day.dayKey, fit: matchTaskToDay(task, day) }));
    return scores.sort((a, b) => b.fit - a.fit)[0].dayKey;
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task = { ...newTask, id: Date.now().toString(), intensity: Number(newTask.intensity) };
    task.assignedDay = autoAssign(task);
    setUserTasks(prev => [...prev, task]);
    setNewTask({ title: '', intensity: 3, mode: 'solo' });
  };

  const reassignTask = (taskId, dayKey) => {
    setUserTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedDay: dayKey } : t));
  };

  const removeTask = (taskId) => setUserTasks(prev => prev.filter(t => t.id !== taskId));

  // ---- Notion / paste import helpers ----
  const callClaudeWithMCP = async (userPrompt, mcpServers = []) => {
    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: userPrompt }],
    };
    if (mcpServers.length > 0) body.mcp_servers = mcpServers;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const mcpResults = (data.content || []).filter(b => b.type === 'mcp_tool_result').map(b => b.content?.[0]?.text || '').join('\n');
    return textBlocks + '\n' + mcpResults;
  };

  const parseTasks = (rawText) => {
    const jsonMatch = rawText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((t, i) => ({
          id: `import_${Date.now()}_${i}`,
          title: t.title || t.name || t.task || String(t),
          intensity: Math.min(5, Math.max(1, Number(t.intensity) || 3)),
          mode: ['solo','collab','visible'].includes(t.mode) ? t.mode : 'solo',
          idealPhase: t.idealPhase || null,
          source: 'imported',
          assignedDay: null,
        })).filter(t => t.title && t.title.length > 1);
      } catch {}
    }
    return [];
  };

  const runProgress = (labels) => {
    setFetchProgress(0);
    setFetchLabel(labels[0]);
    let step = 0;
    const targets = [15, 35, 60, 80, 92];
    const interval = setInterval(() => {
      step++;
      if (step < targets.length) {
        setFetchProgress(targets[step]);
        setFetchLabel(labels[Math.min(step, labels.length - 1)]);
      } else {
        clearInterval(interval);
      }
    }, 900);
    return interval;
  };

  const connectNotion = async () => {
    if (!notionUrl.trim()) return;
    setNotionLoading(true);
    setNotionError('');
    try {
      const prompt = 'Fetch the Notion board at: ' + notionUrl + '. Extract all tasks and return ONLY a valid JSON array, no markdown, no explanation. Each item must have: title (string), intensity (1-5, where 1=light admin, 3=focused work, 5=high-stakes), mode (solo, collab, or visible). If the board is inaccessible return an empty array []';

      const raw = await callClaudeWithMCP(prompt, [{ type: 'url', url: 'https://mcp.notion.com/mcp', name: 'notion-mcp' }]);
      const tasks = parseTasks(raw);
      if (tasks.length === 0) {
        setNotionError('Could not extract tasks from that board. Check the URL or try pasting tasks instead.');
      } else {
        const withDays = tasks.map(t => ({ ...t, assignedDay: autoAssign(t) }));
        setImportedTasks(withDays);
        setUserTasks(prev => [...prev.filter(t => t.source !== 'imported'), ...withDays]);
        setNotionConnected(true);
        setNotionSource(`Notion * ${tasks.length} tasks`);
        clearInterval(progressTimer);
        setFetchProgress(100);
        setFetchLabel('Done!');
        setTimeout(() => { setFetchProgress(0); setPlannerView('mytasks'); }, 600);
      }
    } catch (e) {
      clearInterval(progressTimer);
      setFetchProgress(0);
      setNotionError('Failed to connect. Make sure Notion MCP is enabled and try again.');
    }
    setNotionLoading(false);
  };

  const importPastedTasks = async () => {
    if (!pasteText.trim()) return;
    setNotionLoading(true);
    setNotionError('');
    try {
      const prompt = 'Extract all tasks from the following text and return ONLY a valid JSON array, no markdown, no explanation. Each item must have: title (string), intensity (1-5, where 1=light admin, 3=focused work, 5=high-stakes), mode (solo, collab, or visible). Text: ' + pasteText;

      const raw = await callClaudeWithMCP(prompt);
      const tasks = parseTasks(raw);
      if (tasks.length === 0) {
        setNotionError("Couldn't parse tasks. Try a cleaner list format -- one task per line works best.");
      } else {
        const withDays = tasks.map(t => ({ ...t, assignedDay: autoAssign(t) }));
        setImportedTasks(withDays);
        setUserTasks(prev => [...prev.filter(t => t.source !== 'imported'), ...withDays]);
        setNotionConnected(true);
        setNotionSource(`Pasted list * ${tasks.length} tasks`);
        clearInterval(progressTimer2);
        setFetchProgress(100);
        setFetchLabel('Done!');
        setTimeout(() => { setFetchProgress(0); setPlannerView('mytasks'); }, 600);
      }
    } catch (e) {
      clearInterval(progressTimer2);
      setFetchProgress(0);
      setNotionError('Something went wrong parsing your list. Try again.');
    }
    setNotionLoading(false);
  };

  const clearImported = () => {
    setImportedTasks([]);
    setUserTasks(prev => prev.filter(t => t.source !== 'imported'));
    setNotionConnected(false);
    setNotionSource('');
    setNotionUrl('');
    setPasteText('');
    setNotionError('');
  };

  const update = (k, v) => setData(p => ({ ...p, [k]: v }));

  const geocode = async () => {
    if (!data.pob.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.pob)}&format=json&limit=1`);
      const results = await res.json();
      if (results && results.length > 0) {
        setData(p => ({ ...p, pobLat: parseFloat(results[0].lat), pobLon: parseFloat(results[0].lon), pob: results[0].display_name.split(',').slice(0, 3).join(',').trim() }));
      } else {
        setGeocodeError('Location not found. Try "City, Country".');
      }
    } catch (e) {
      setGeocodeError('Could not look up location. You can still continue.');
    }
    setGeocoding(false);
  };

  const logSymptom = (key, severity) => {
    setPmsLog(prev => ({ ...prev, [todayKey]: { ...(prev[todayKey] || {}), [key]: severity } }));
  };

  // ===== ONBOARDING =====
  if (step < 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white p-6 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="flex gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-amber-400' : 'bg-white/10'}`} />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-sm mb-2"><Sparkles className="w-4 h-4" />Step 1 of 3</div>
                <h1 className="text-4xl font-light mb-2">Let's start with <span className="italic text-amber-200">you</span></h1>
                <p className="text-white/60">Basic details for your natal chart.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-1 mb-2"><User className="w-3 h-3" />Name</label>
                  <input value={data.name} onChange={e => update('name', e.target.value)} placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-amber-400/50 focus:outline-none transition" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-1 mb-2"><Calendar className="w-3 h-3" />Date of birth</label>
                    <input type="date" value={data.dob} onChange={e => update('dob', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-amber-400/50 focus:outline-none transition" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-1 mb-2"><Clock className="w-3 h-3" />Time of birth</label>
                    <input type="time" value={data.tob} onChange={e => update('tob', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-amber-400/50 focus:outline-none transition" />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />Place of birth</label>
                  <input
                    value={citySearch || data.pob}
                    onChange={e => { setCitySearch(e.target.value); setShowCityList(true); if (data.pobLat) { update('pob', ''); update('pobLat', null); update('pobLon', null); } }}
                    onFocus={() => setShowCityList(true)}
                    placeholder="Search city or country..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-amber-400/50 focus:outline-none transition"
                  />
                  {showCityList && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-lg overflow-hidden z-10 max-h-64 overflow-y-auto shadow-xl">
                      {filteredCities.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-white/40">No matches. Try a nearby major city.</div>
                      ) : filteredCities.map((c, i) => (
                        <button key={i}
                          onClick={() => {
                            setData(p => ({ ...p, pob: `${c.n}, ${c.c}`, pobLat: c.lat, pobLon: c.lon }));
                            setCitySearch('');
                            setShowCityList(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition text-sm flex justify-between items-center border-b border-white/5 last:border-0">
                          <span>{c.n}</span>
                          <span className="text-xs text-white/40">{c.c}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {data.pobLat !== null && !showCityList && (
                    <div className="text-xs text-emerald-300/70 mt-1.5">✓ {data.pob} -- rising sign calculable</div>
                  )}
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Female', 'Male', 'Non-binary'].map(g => (
                      <button key={g} onClick={() => update('gender', g)}
                        className={`py-3 rounded-lg border transition text-sm ${data.gender === g ? 'bg-amber-400/20 border-amber-400/50 text-amber-200' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(1)} disabled={!data.name || !data.dob || !data.gender}
                className="w-full py-3 bg-amber-400 text-slate-950 font-medium rounded-lg hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-rose-400 text-sm mb-2"><Droplet className="w-4 h-4" />Step 2 of 3</div>
                <h1 className="text-4xl font-light mb-2">Cycle <span className="italic text-rose-200">tracking</span></h1>
                <p className="text-white/60">Skip if not applicable -- you'll still get astro readings.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => update('trackingCycle', true)}
                  className={`py-4 rounded-lg border transition ${data.trackingCycle ? 'bg-rose-400/20 border-rose-400/50 text-rose-100' : 'bg-white/5 border-white/10'}`}>Track my cycle</button>
                <button onClick={() => update('trackingCycle', false)}
                  className={`py-4 rounded-lg border transition ${!data.trackingCycle ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'}`}>Skip</button>
              </div>
              {data.trackingCycle && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">First day of your last period</label>
                    <input type="date" value={data.lastPeriod} onChange={e => update('lastPeriod', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-rose-400/50 focus:outline-none transition" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Average cycle length: <span className="text-rose-200">{data.cycleLength} days</span></label>
                    <input type="range" min="21" max="40" value={data.cycleLength} onChange={e => update('cycleLength', e.target.value)} className="w-full accent-rose-400" />
                    <div className="flex justify-between text-xs text-white/40 mt-1"><span>21</span><span>28 (avg)</span><span>40</span></div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Period length: <span className="text-rose-200">{data.periodLength} days</span></label>
                    <input type="range" min="2" max="10" value={data.periodLength} onChange={e => update('periodLength', e.target.value)} className="w-full accent-rose-400" />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">Back</button>
                <button onClick={() => setStep(2)} disabled={data.trackingCycle && !data.lastPeriod}
                  className="flex-1 py-3 bg-amber-400 text-slate-950 font-medium rounded-lg hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-violet-400 text-sm mb-2"><Moon className="w-4 h-4" />Step 3 of 3</div>
                <h1 className="text-4xl font-light mb-2">Ready, <span className="italic text-violet-200">{data.name}</span></h1>
                <p className="text-white/60">Generating your reading for {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Born</span><span>{new Date(data.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {data.tob}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Place</span><span>{data.pob || '--'}</span></div>
                {data.trackingCycle && <div className="flex justify-between"><span className="text-white/50">Cycle</span><span>{data.cycleLength}d avg, {data.periodLength}d period</span></div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-amber-400 text-slate-950 font-medium rounded-lg hover:bg-amber-300 transition flex items-center justify-center gap-2">
                  Open dashboard <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  const PhaseIcon = cycle?.icon;
  const todayLog = pmsLog[todayKey] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40">{today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <h1 className="text-3xl font-light">Hello, <span className="italic text-amber-200">{data.name}</span></h1>
          </div>
          <button onClick={() => setStep(0)} className="text-xs text-white/40 hover:text-white/80 transition">edit profile</button>
        </div>

        {/* PMS Alert Banner */}
        {cycle?.pmsActive && (
          <div className="bg-gradient-to-r from-purple-900/60 to-rose-900/60 border border-purple-400/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-300 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-widest text-rose-200">PMS Window * Day {cycle.pmsDay} of ~6</span>
                </div>
                <p className="text-sm text-white/80 mb-3">Your body is entering the premenstrual window. Energy dropping, sensitivity rising. <span className="text-rose-200">Protect your calendar, finish don't start, be extra gentle.</span></p>
                <button onClick={() => setShowPmsLog(!showPmsLog)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition">
                  {showPmsLog ? 'Hide' : 'Log'} today's symptoms
                </button>
              </div>
            </div>

            {showPmsLog && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs uppercase tracking-wider text-white/50 mb-3">Rate severity (0 = none, 3 = severe)</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PMS_SYMPTOMS.map(s => (
                    <div key={s.key} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm flex items-center gap-1.5"><span>{s.icon}</span>{s.label}</span>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(sev => (
                          <button key={sev} onClick={() => logSymptom(s.key, sev)}
                            className={`flex-1 py-1.5 text-xs rounded transition ${
                              todayLog[s.key] === sev
                                ? sev === 0 ? 'bg-emerald-400/30 text-emerald-100' : sev === 1 ? 'bg-amber-400/30 text-amber-100' : sev === 2 ? 'bg-orange-400/30 text-orange-100' : 'bg-rose-400/30 text-rose-100'
                                : 'bg-white/5 hover:bg-white/10 text-white/50'
                            }`}>{sev}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {pmsInsights && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/60">
                    <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-3 h-3" />Pattern from {pmsInsights.totalDays} logged day{pmsInsights.totalDays > 1 ? 's' : ''}</div>
                    <div className="flex flex-wrap gap-2">
                      {pmsInsights.top.map(([k, v]) => {
                        const sym = PMS_SYMPTOMS.find(s => s.key === k);
                        return sym ? <span key={k} className="bg-white/10 px-2 py-1 rounded">{sym.icon} {sym.label} * {v}</span> : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rising sign -- hero card when available */}
        {natalChart?.ascendant && (
          <div className="bg-gradient-to-br from-fuchsia-500/15 via-violet-500/15 to-indigo-500/15 border border-fuchsia-400/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-fuchsia-300" />
              <span className="text-xs uppercase tracking-widest text-white/60">Your Rising Sign * The Mask You Wear</span>
            </div>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl">{natalChart.ascendant.symbol}</span>
                  <h2 className="text-4xl font-light">{natalChart.ascendant.name} Rising</h2>
                </div>
                <p className="text-sm text-white/80 mb-2">{RISING_TRAITS[natalChart.ascendant.name].vibe}</p>
                <p className="text-sm text-white/60 mb-2">{RISING_TRAITS[natalChart.ascendant.name].presence}</p>
                <p className="text-xs text-white/50"><span className="text-fuchsia-300/70">Style signature:</span> {RISING_TRAITS[natalChart.ascendant.name].style}</p>
              </div>
              {natalChart.midheaven && (
                <div className="bg-white/5 rounded-lg p-4 min-w-[160px]">
                  <div className="text-xs text-white/50 mb-1">Midheaven (career)</div>
                  <div className="text-2xl">{natalChart.midheaven.symbol} {natalChart.midheaven.name}</div>
                  <div className="text-xs text-white/40 mt-1">Public role, reputation, trajectory</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top grid: Cycle + Moon */}
        <div className="grid md:grid-cols-2 gap-4">
          {cycle && (
            <div className={`bg-gradient-to-br ${cycle.gradient} rounded-2xl p-6 border border-white/10`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PhaseIcon className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest text-white/60">Cycle Phase</span>
                </div>
                <span className="text-xs text-white/60">Day {cycle.dayInCycle} of {cycle.cycleLength}</span>
              </div>
              <h2 className="text-4xl font-light mb-1">{cycle.phase}</h2>
              {cycle.subPhase && <div className="text-sm text-white/60 mb-2 italic">{cycle.subPhase}</div>}
              <p className="text-white/70 mb-4 text-sm">{cycle.energy}</p>
              <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-white/60 rounded-full" style={{ width: `${(cycle.dayInCycle / cycle.cycleLength) * 100}%` }} />
                <div className="absolute top-0 h-full w-px bg-amber-300/60" style={{ left: `${(cycle.ovulationDay / cycle.cycleLength) * 100}%` }} title="Ovulation" />
                <div className="absolute top-0 h-full w-px bg-rose-300/60" style={{ left: `${(cycle.pmsStart / cycle.cycleLength) * 100}%` }} title="PMS starts" />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mb-4">
                <span>Start</span><span className="text-amber-300/70">Ovulation D{cycle.ovulationDay}</span><span className="text-rose-300/70">PMS D{cycle.pmsStart}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-white/50">Focus:</span> {cycle.focus}</div>
                <div><span className="text-white/50">Task fit:</span> {cycle.tasks}</div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-800 to-indigo-950 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest text-white/60">Lunar Phase</span>
              </div>
              <span className="text-xs text-white/60">{todayChart.lunar.illumination}% illuminated</span>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl">{todayChart.lunar.emoji}</span>
              <h2 className="text-3xl font-light">{todayChart.lunar.phase}</h2>
            </div>
            <p className="text-white/70 mb-4 text-sm">{LUNAR_GUIDANCE[todayChart.lunar.phase].e}</p>
            <div className="space-y-2 text-sm">
              <div><span className="text-emerald-300/70">Do:</span> {LUNAR_GUIDANCE[todayChart.lunar.phase].d}</div>
              <div><span className="text-rose-300/70">Avoid:</span> {LUNAR_GUIDANCE[todayChart.lunar.phase].a}</div>
            </div>
          </div>
        </div>

        {/* Today's Aspects */}
        {aspects.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-300" />
                <span className="text-xs uppercase tracking-widest text-white/60">Today's Aspects to Natal</span>
              </div>
              <span className="text-xs text-white/40">{aspects.length} active</span>
            </div>
            <div className="space-y-2">
              {aspects.slice(0, 8).map((asp, i) => (
                <div key={i} className={`bg-white/5 rounded-lg p-3 border-l-2 ${asp.exact ? 'border-amber-400' : 'border-white/20'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="capitalize text-white/80">Transit {asp.transit}</span>
                      <span className={`${asp.color} text-lg`}>{asp.symbol}</span>
                      <span className="capitalize text-white/80">Natal {asp.natal}</span>
                      {asp.exact && <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded">EXACT</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={asp.color}>{asp.aspect}</span>
                      <span className="text-white/40">orb {asp.orb}°</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">{asp.interpretation}</p>
                </div>
              ))}
            </div>
            {aspects.length > 8 && <div className="text-xs text-white/40 text-center mt-3">+ {aspects.length - 8} more minor aspects</div>}
          </div>
        )}

        {/* Today's transits */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-amber-300" />
            <span className="text-xs uppercase tracking-widest text-white/60">Today's Sky</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Sun', data: todayChart.sun }, { label: 'Moon', data: todayChart.moon },
              { label: 'Mercury', data: todayChart.mercury }, { label: 'Venus', data: todayChart.venus },
              { label: 'Mars', data: todayChart.mars },
            ].map(({ label, data: d }) => (
              <div key={label} className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xs text-white/50 mb-1">{label}</div>
                <div className="text-2xl mb-1">{d.symbol}</div>
                <div className="text-sm font-medium">{d.name}</div>
                <div className="text-xs text-white/40">{d.degree.toFixed(1)}°</div>
              </div>
            ))}
          </div>
        </div>

        {/* Natal chart */}
        {natalChart && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-300" />
              <span className="text-xs uppercase tracking-widest text-white/60">Your Natal Chart</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-400/20 rounded-lg p-4">
                <div className="text-xs text-amber-300/70 mb-1">☉ Sun (identity)</div>
                <div className="text-xl font-light">{natalChart.sun.symbol} {natalChart.sun.name}</div>
                <div className="text-xs text-white/40 mt-1">{natalChart.sun.element} * ruled by {natalChart.sun.ruler}</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-700/10 border border-indigo-400/20 rounded-lg p-4">
                <div className="text-xs text-indigo-300/70 mb-1">☽ Moon (emotions)</div>
                <div className="text-xl font-light">{natalChart.moon.symbol} {natalChart.moon.name}</div>
                <div className="text-xs text-white/40 mt-1">{natalChart.moon.element} * ruled by {natalChart.moon.ruler}</div>
              </div>
              <div className="bg-gradient-to-br from-sky-500/20 to-sky-700/10 border border-sky-400/20 rounded-lg p-4">
                <div className="text-xs text-sky-300/70 mb-1">☿ Mercury (mind)</div>
                <div className="text-xl font-light">{natalChart.mercury.symbol} {natalChart.mercury.name}</div>
                <div className="text-xs text-white/40 mt-1">{natalChart.mercury.element}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-500/20 to-pink-700/10 border border-pink-400/20 rounded-lg p-4">
                <div className="text-xs text-pink-300/70 mb-1">♀ Venus (values)</div>
                <div className="text-xl font-light">{natalChart.venus.symbol} {natalChart.venus.name}</div>
                <div className="text-xs text-white/40 mt-1">{natalChart.venus.element}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '♂ Mars', sub: 'drive', d: natalChart.mars },
                { label: '♃ Jupiter', sub: 'growth', d: natalChart.jupiter },
                { label: '♄ Saturn', sub: 'structure', d: natalChart.saturn },
              ].map(p => (
                <div key={p.label} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/50">{p.label} <span className="text-white/30">({p.sub})</span></div>
                  <div className="text-sm mt-1">{p.d.symbol} {p.d.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-Day Forecast */}
        {forecast.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-300" />
                <span className="text-xs uppercase tracking-widest text-white/60">7-Day Forecast * Plan the Week</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>peak/strong</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>steady</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span>careful/protect</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {forecast.map((day, i) => {
                const isToday = i === 0;
                const verdictColor = {
                  peak: 'from-emerald-500/30 to-emerald-700/10 border-emerald-400/40',
                  strong: 'from-emerald-500/20 to-teal-700/10 border-emerald-400/25',
                  steady: 'from-amber-500/15 to-amber-700/5 border-amber-400/20',
                  careful: 'from-orange-500/15 to-rose-700/5 border-orange-400/25',
                  protect: 'from-rose-500/20 to-purple-900/10 border-rose-400/30',
                }[day.verdict];
                const scoreColor = day.score >= 60 ? 'text-emerald-300' : day.score >= 40 ? 'text-amber-300' : 'text-rose-300';
                return (
                  <div key={i} className={`bg-gradient-to-br ${verdictColor} border rounded-xl p-3 ${isToday ? 'ring-2 ring-amber-400/40' : ''}`}>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">{isToday ? 'Today' : day.date.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                    <div className="text-sm font-medium mb-2">{day.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    <div className={`text-2xl font-light ${scoreColor}`}>{day.score}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2">{day.verdict}</div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1 text-white/60">
                        <span>{day.lunar.emoji}</span>
                        <span className="truncate">{day.lunar.phase.replace('Waxing ', 'Wax ').replace('Waning ', 'Wan ')}</span>
                      </div>
                      {day.cycle && (
                        <div className="text-white/60 truncate">
                          {day.cycle.pmsActive ? '⚠ PMS' : day.cycle.phase === 'Ovulatory' ? '🔥 Ovulatory' : day.cycle.phase === 'Follicular' ? '✨ Follicular' : day.cycle.phase === 'Menstrual' ? '💧 Menstrual' : day.cycle.subPhase === 'Early Luteal' ? '🧠 E.Luteal' : '🧠 Luteal'}
                        </div>
                      )}
                      {day.exactCount > 0 && (
                        <div className="flex items-center gap-1">
                          {day.flowExact > 0 && <span className="text-emerald-300">+{day.flowExact}</span>}
                          {day.hardExact > 0 && <span className="text-rose-300">-{day.hardExact}</span>}
                          <span className="text-white/40 text-[9px]">exact</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Best/Worst callouts */}
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {(() => {
                const best = [...forecast].sort((a, b) => b.score - a.score)[0];
                const worst = [...forecast].sort((a, b) => a.score - b.score)[0];
                const bestDay = best.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
                const worstDay = worst.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
                return (
                  <>
                    <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-300/70 mb-1">^ Best day this week</div>
                      <div className="text-sm font-medium">{bestDay}</div>
                      <div className="text-xs text-white/60 mt-1">
                        Schedule pitches, launches, tough conversations, investor calls, creative sprints.
                        {best.cycle?.phase === 'Ovulatory' && ' Ovulatory peak -- lean into visibility.'}
                        {best.flowExact > 0 && ` ${best.flowExact} exact flow aspect${best.flowExact > 1 ? 's' : ''}.`}
                      </div>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-400/20 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wider text-rose-300/70 mb-1">v Protect this day</div>
                      <div className="text-sm font-medium">{worstDay}</div>
                      <div className="text-xs text-white/60 mt-1">
                        Buffer the calendar. Finish don't start. Avoid high-stakes meetings if possible.
                        {worst.cycle?.pmsActive && ' PMS window active.'}
                        {worst.hardExact > 0 && ` ${worst.hardExact} exact hard aspect${worst.hardExact > 1 ? 's' : ''}.`}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Upcoming key aspects */}
            {(() => {
              const keyAspects = [];
              forecast.forEach(day => {
                day.aspects.filter(a => a.exact).forEach(a => {
                  keyAspects.push({ ...a, date: day.date });
                });
              });
              if (keyAspects.length === 0) return null;
              return (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1"><Activity className="w-3 h-3" />Exact aspects this week</div>
                  <div className="space-y-1.5">
                    {keyAspects.slice(0, 6).map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-white/5 rounded-md px-3 py-1.5">
                        <span className="text-white/50 w-20 shrink-0">{a.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</span>
                        <span className={`${a.color} shrink-0`}>{a.symbol}</span>
                        <span className="capitalize text-white/80 truncate">Transit {a.transit} {a.aspect} natal {a.natal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Task Planner */}
        {forecast.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                <span className="text-xs uppercase tracking-widest text-white/60">Cycle-Synced Planner</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {notionConnected && (
                  <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    {notionSource}
                    <button onClick={clearImported} className="text-emerald-300/50 hover:text-rose-300 ml-1 transition" title="Disconnect"><RefreshCw className="w-3 h-3" /></button>
                  </div>
                )}
                <div className="flex bg-white/5 rounded-lg p-0.5 text-xs">
                  {notionConnected && (
                    <>
                      <button onClick={() => setPlannerView('suggestions')}
                        className={`px-3 py-1.5 rounded transition ${plannerView === 'suggestions' ? 'bg-white/15 text-white' : 'text-white/50'}`}>
                        Suggestions
                      </button>
                      <button onClick={() => setPlannerView('mytasks')}
                        className={`px-3 py-1.5 rounded transition ${plannerView === 'mytasks' ? 'bg-white/15 text-white' : 'text-white/50'}`}>
                        My Tasks ({userTasks.length})
                      </button>
                    </>
                  )}
                  <button onClick={() => setPlannerView('connect')}
                    className={`px-3 py-1.5 rounded transition flex items-center gap-1 ${plannerView === 'connect' ? 'bg-violet-500/30 text-violet-200' : 'text-white/50'}`}>
                    <Link className="w-3 h-3" />{notionConnected ? 'Reconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>

            {plannerView === 'suggestions' && notionConnected && (
              <div className="space-y-3">
                {userTasks.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-sm">No tasks loaded yet. Go to Connect to import your planner.</div>
                ) : (
                  weekPlan.map((day, i) => {
                    if (day.suggestions.length === 0) return null;
                    const isToday = i === 0;
                    const modeColor = { solo: 'text-sky-300/70', collab: 'text-emerald-300/70', visible: 'text-amber-300/70' };
                    return (
                      <div key={i} className={`flex gap-3 items-start ${day.isLow ? 'opacity-75' : ''}`}>
                        <div className={`shrink-0 w-16 text-center pt-2 ${isToday ? 'text-amber-300' : 'text-white/50'}`}>
                          <div className="text-[10px] uppercase tracking-wider">{isToday ? 'Today' : day.date.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                          <div className="text-sm font-medium">{day.date.toLocaleDateString('en-GB', { day: 'numeric' })}</div>
                          <div className={`text-[10px] mt-1 ${day.score >= 60 ? 'text-emerald-400' : day.score >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{day.score}</div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {day.suggestions.map((task, j) => (
                            <div key={j} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                              <span className="text-sm text-white/85 truncate flex-1">{task.title}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-white/30">{'●'.repeat(task.intensity)}{'○'.repeat(5 - task.intensity)}</span>
                                <span className={`text-[10px] uppercase tracking-wider ${modeColor[task.mode] || 'text-white/40'}`}>{task.mode}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {plannerView === 'mytasks' && notionConnected && (
              <div className="space-y-4">
                {/* Add task form */}
                <div className="bg-white/5 rounded-lg p-3 space-y-3">
                  <div className="flex gap-2">
                    <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                      placeholder="Add a task manually..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-400/50 focus:outline-none" />
                    <button onClick={addTask} disabled={!newTask.title.trim()}
                      className="px-4 bg-amber-400 text-slate-950 font-medium rounded-lg text-sm hover:bg-amber-300 disabled:opacity-30 transition">
                      + Assign
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-white/40">Intensity:</span>
                      {[1, 2, 3, 4, 5].map(i => (
                        <button key={i} onClick={() => setNewTask(p => ({ ...p, intensity: i }))}
                          className={`w-6 h-6 rounded text-[10px] transition ${newTask.intensity === i ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                          {i}
                        </button>
                      ))}
                    </div>
                    <select value={newTask.mode} onChange={e => setNewTask(p => ({ ...p, mode: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs">
                      <option value="solo" className="bg-slate-900">solo</option>
                      <option value="collab" className="bg-slate-900">collab</option>
                      <option value="visible" className="bg-slate-900">visible</option>
                    </select>
                  </div>
                </div>

                {userTasks.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-sm">No tasks yet. Add one above or import from Connect.</div>
                ) : (
                  <div className="space-y-2">
                    {weekPlan.map(day => {
                      const dayTasks = userTasks.filter(t => t.assignedDay === day.dayKey);
                      if (dayTasks.length === 0) return null;
                      const isToday = day.dayKey === today.toISOString().split('T')[0];
                      const modeColor = { solo: 'text-sky-300/70', collab: 'text-emerald-300/70', visible: 'text-amber-300/70' };
                      return (
                        <div key={day.dayKey} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs">
                              <span className={isToday ? 'text-amber-300' : 'text-white/60'}>
                                {isToday ? 'Today' : day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                              </span>
                              <span className="text-white/30 ml-2">* {day.verdict} ({day.score})</span>
                            </div>
                          </div>
                          {dayTasks.map(task => {
                            const fit = matchTaskToDay(task, day);
                            const fitColor = fit >= 70 ? 'text-emerald-300' : fit >= 50 ? 'text-amber-300' : 'text-rose-300';
                            return (
                              <div key={task.id} className="bg-white/5 border border-white/10 rounded px-3 py-2 flex items-center gap-2 mb-1.5">
                                <span className="text-sm flex-1 truncate">{task.title}</span>
                                <span className="text-[10px] text-white/30">{'●'.repeat(task.intensity)}{'○'.repeat(5-task.intensity)}</span>
                                <span className={`text-[10px] uppercase tracking-wider ${modeColor[task.mode] || 'text-white/40'}`}>{task.mode}</span>
                                <span className={`text-[10px] ${fitColor}`}>fit {fit}</span>
                                <select value={task.assignedDay} onChange={e => reassignTask(task.id, e.target.value)}
                                  className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px]">
                                  {weekPlan.map(d => (
                                    <option key={d.dayKey} value={d.dayKey} className="bg-slate-900">
                                      {d.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                                    </option>
                                  ))}
                                </select>
                                {task.source === 'imported' && <span className="text-[9px] bg-violet-400/20 text-violet-300 px-1.5 py-0.5 rounded">imported</span>}
                                <button onClick={() => removeTask(task.id)} className="text-white/30 hover:text-rose-300 text-xs">✕</button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {plannerView === 'connect' && (
              <div className="space-y-6">
                {!notionConnected && (
                  <div className="text-center py-2">
                    <p className="text-white/50 text-sm mb-1">Connect your planner to get started.</p>
                    <p className="text-white/30 text-xs">Tasks will be auto-assigned across your week based on cycle phase and astro score.</p>
                  </div>
                )}
                <div className="flex bg-white/5 rounded-lg p-0.5 text-xs w-fit">
                  <button onClick={() => setConnectTab('notion')}
                    className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${connectTab === 'notion' ? 'bg-white/15 text-white' : 'text-white/50'}`}>
                    <span className="font-bold text-sm leading-none">N</span> Notion
                  </button>
                  <button onClick={() => setConnectTab('paste')}
                    className={`px-4 py-2 rounded transition flex items-center gap-1.5 ${connectTab === 'paste' ? 'bg-white/15 text-white' : 'text-white/50'}`}>
                    <FileText className="w-3 h-3" /> Paste List
                  </button>
                </div>

                {connectTab === 'notion' && (
                  <div className="space-y-4">
                    <p className="text-sm text-white/50">
                      Paste your Notion database or board URL. Claude will connect via Notion MCP and pull your tasks automatically.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={notionUrl}
                        onChange={e => setNotionUrl(e.target.value)}
                        placeholder="https://www.notion.so/your-workspace/board..."
                        disabled={notionLoading}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-violet-400/50 focus:outline-none transition font-mono text-xs disabled:opacity-50"
                      />
                      <button onClick={connectNotion} disabled={!notionUrl.trim() || notionLoading}
                        className="px-4 bg-violet-500 text-white font-medium rounded-lg text-sm hover:bg-violet-400 disabled:opacity-40 transition flex items-center gap-2 whitespace-nowrap">
                        <Link className="w-4 h-4" />
                        {notionLoading ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                    {notionLoading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>{fetchLabel}</span>
                          <span>{fetchProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-400 rounded-full"
                            style={{ width: `${fetchProgress}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                          />
                        </div>
                      </div>
                    )}
                    {!notionLoading && <p className="text-xs text-white/25">Make sure the Notion integration has access to your board. Intensity and mode are inferred from task content.</p>}
                  </div>
                )}

                {connectTab === 'paste' && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/50">
                      Paste tasks from anywhere -- Google Tasks, Todoist, notes, or plain bullet points. Claude will parse intensity and mode from the wording.
                    </p>
                    <textarea
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      placeholder="One task per line. E.g: Finish proposal, Review brand deck, Team ops review, Update report..."
                      rows={7}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400/50 focus:outline-none transition resize-none font-mono text-xs leading-relaxed"
                    />
                    <button onClick={importPastedTasks} disabled={!pasteText.trim() || notionLoading}
                      className="w-full py-2.5 bg-amber-400 text-slate-950 font-medium rounded-lg text-sm hover:bg-amber-300 disabled:opacity-40 transition flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {notionLoading ? 'Importing...' : 'Parse & Import'}
                    </button>
                    {notionLoading && (
                      <div className="space-y-2 mt-1">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>{fetchLabel}</span>
                          <span>{fetchProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${fetchProgress}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {notionError && (
                  <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg px-4 py-3 text-sm text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {notionError}
                  </div>
                )}

                {notionConnected && (
                  <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-4 py-3 text-sm text-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>{notionSource} imported and scheduled.</span>
                    </div>
                    <button onClick={() => setPlannerView('mytasks')} className="text-xs bg-emerald-400/20 hover:bg-emerald-400/30 px-3 py-1 rounded transition">
                      View tasks &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

                {/* Synthesis */}
        {cycle && (
          <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-violet-500/10 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="text-xs uppercase tracking-widest text-white/60">Today's Synthesis</span>
            </div>
            <p className="text-white/80 leading-relaxed text-sm">
              Your body is in <span className="text-rose-200 font-medium">{cycle.subPhase || cycle.phase}</span> phase while the moon is <span className="text-indigo-200 font-medium">{todayChart.lunar.phase}</span>.
              {cycle.pmsActive && ' This is your PMS window -- honor the dip. '}
              {cycle.phase === 'Menstrual' && todayChart.lunar.phase.includes('New') && ' Perfect alignment -- your body and the sky both call for inward planning. '}
              {cycle.phase === 'Ovulatory' && todayChart.lunar.phase === 'Full Moon' && ' Double peak energy -- best day for launches, pitches, visibility. '}
              {cycle.phase === 'Luteal' && todayChart.lunar.phase.includes('Waning') && ' Both body and moon lean toward finishing, editing, releasing. '}
              {aspects.filter(a => a.exact).length > 0 && (
                <> <span className="text-amber-200">{aspects.filter(a => a.exact).length} exact aspect{aspects.filter(a => a.exact).length > 1 ? 's' : ''} today</span> -- pay attention to these themes. </>
              )}
              With Sun in {todayChart.sun.name} and Moon in {todayChart.moon.name}, channel this into {cycle.tasks.split(',')[0].toLowerCase()}.
              {natalChart?.ascendant && <> As a <span className="text-fuchsia-200 font-medium">{natalChart.ascendant.name} rising</span>, lean into your natural {RISING_TRAITS[natalChart.ascendant.name].vibe.toLowerCase().split(',')[0]} presence today.</>}
            </p>
          </div>
        )}

        <div className="text-center text-xs text-white/30 pt-4">
          Astro calculations are simplified approximations (~0.5° accuracy). For precision integration into your planner, connect Swiss Ephemeris via backend.
        </div>
      </div>
    </div>
  );
}
