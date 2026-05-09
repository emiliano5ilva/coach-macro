// ─── COMPLETE RUNNING + HYROX + HYBRID PROGRAMS ───────────────────────────────

// ── RUNNING ───────────────────────────────────────────────────────────────────
export const RUNNING_PROGRAMS = {
  "Couch to 5K": {
    weeks: 8,
    goal: "Run 5K without stopping",
    daysPerWeek: 3,
    runDays: ["Mon","Wed","Fri"],
    schedule: [
      { week:1, theme:"First steps", days:[
        { day:"Mon", type:"Run/Walk", duration:30, description:"5 min walk warm up. Alternate 60 sec jog / 90 sec walk for 20 min. 5 min walk cool down.",
          skill_variants:{
            novice:{ description:"5 min walk. Alternate 45 sec jog / 90 sec walk × 8. 5 min walk. Stop if you can't breathe through your nose.", duration:25, distance:1.5, zone:"Zone 1", notes:"This should feel embarrassingly easy — that's correct." },
            intermediate:{ description:"5 min walk warm up. Alternate 60 sec jog / 90 sec walk for 20 min. 5 min walk cool down.", duration:30, distance:2.5, zone:"Zone 2", notes:"You should be able to speak in full sentences during jog intervals." },
            advanced:{ description:"5 min walk. Alternate 90 sec jog / 60 sec walk × 8. 5 min easy jog cool down.", duration:35, distance:4, zone:"Zone 2", notes:"Keep it aerobic — base building week, not racing." }
          }
        },
        { day:"Wed", type:"Run/Walk", duration:30, description:"Repeat Monday.",
          skill_variants:{
            novice:{ description:"Repeat Monday. Focus on posture — shoulders relaxed, arms swinging naturally.", duration:25, distance:1.5, zone:"Zone 1", notes:"Two identical sessions is intentional — repetition builds the habit." },
            intermediate:{ description:"Repeat Monday. Notice if it feels easier — it should.", duration:30, distance:2.5, zone:"Zone 2", notes:"Consistency matters more than pace right now." },
            advanced:{ description:"Repeat Monday. Add 4×20 sec strides before the cool down walk.", duration:38, distance:4.5, zone:"Zone 2 with strides", notes:"Strides are relaxed accelerations — 20 sec on, 40 sec walk recovery." }
          }
        },
        { day:"Fri", type:"Run/Walk", duration:30, description:"Repeat Monday. Focus on breathing — you should be able to speak in short sentences.",
          skill_variants:{
            novice:{ description:"Repeat Monday. Three runs in one week is a bigger achievement than it sounds.", duration:25, distance:1.5, zone:"Zone 1", notes:"End of week 1. Your body is already adapting." },
            intermediate:{ description:"Repeat Monday. Focus on breathing — you should be able to speak in short sentences.", duration:30, distance:2.5, zone:"Zone 2", notes:"If today feels harder than Monday that's normal — week 2 will feel better." },
            advanced:{ description:"Repeat Wednesday with strides. Focus on tall posture and relaxed form.", duration:38, distance:4.5, zone:"Zone 2 with strides", notes:"Week 1 done. Don't skip the base — it determines everything later." }
          }
        }
      ]},
      { week:2, theme:"Building rhythm", days:[
        { day:"Mon", type:"Run/Walk", duration:30, description:"5 min walk. Alternate 90 sec jog / 2 min walk for 20 min. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. Alternate 60 sec jog / 90 sec walk × 8. 5 min walk.", duration:28, distance:2, zone:"Zone 1", notes:"Goal is finishing all intervals — even if the jog is barely faster than a walk." },
            intermediate:{ description:"5 min walk. Alternate 90 sec jog / 2 min walk for 20 min. 5 min walk.", duration:30, distance:2.8, zone:"Zone 2", notes:"90 seconds feels longer than 60 — find a pace you can genuinely hold." },
            advanced:{ description:"5 min walk. Alternate 2.5 min jog / 60 sec walk × 6. 5 min easy jog + 4 strides.", duration:40, distance:5, zone:"Zone 2 with strides", notes:"Running-to-walking ratio shifting in your favor — keep the easy effort easy." }
          }
        },
        { day:"Wed", type:"Run/Walk", duration:30, description:"Repeat Monday.",
          skill_variants:{
            novice:{ description:"Repeat Monday. Try rhythmic breathing — inhale 3 steps, exhale 3 steps.", duration:28, distance:2, zone:"Zone 1", notes:"Midweek is harder. Expected. You're building the habit." },
            intermediate:{ description:"Repeat Monday. You're improving. Trust the process.", duration:30, distance:2.8, zone:"Zone 2", notes:"If you felt like stopping, you went out too fast — start slower next interval." },
            advanced:{ description:"Repeat Monday. Target 170-180 steps per minute, light landing.", duration:40, distance:5, zone:"Zone 2 with strides", notes:"Form built now pays dividends when mileage increases." }
          }
        },
        { day:"Fri", type:"Run/Walk", duration:30, description:"Repeat Monday. Getting easier? Good — it should.",
          skill_variants:{
            novice:{ description:"Repeat Monday. Week 2 done — you've now run more than most people do in a month.", duration:28, distance:2, zone:"Zone 1", notes:"Week 3 has longer intervals. You're ready." },
            intermediate:{ description:"Repeat Monday. Getting easier confirms your aerobic system is responding.", duration:30, distance:2.8, zone:"Zone 2", notes:"If still hard, repeat week 2 before advancing — no shame, just smart." },
            advanced:{ description:"Repeat Monday + strides. Longer intervals arrive next week.", duration:40, distance:5, zone:"Zone 2 with strides", notes:"Longest week so far. Recovery tomorrow is important." }
          }
        }
      ]},
      { week:3, theme:"Longer intervals", days:[
        { day:"Mon", type:"Run/Walk", duration:35, description:"5 min walk. Then: 90 sec jog, 90 sec walk, 3 min jog, 3 min walk — repeat twice. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. Then: 60 sec jog, 90 sec walk, 90 sec jog, 2 min walk — repeat three times. 5 min walk.", duration:30, distance:2.2, zone:"Zone 1", notes:"The 90-second run is your new challenge — go very slow to finish it." },
            intermediate:{ description:"5 min walk. Then: 90 sec jog, 90 sec walk, 3 min jog, 3 min walk — repeat twice. 5 min walk.", duration:35, distance:3, zone:"Zone 2", notes:"3 minutes continuous is a real milestone — slow down more than you think." },
            advanced:{ description:"5 min walk. 2 min jog, 60 sec walk, 5 min jog, 90 sec walk — repeat twice. 5 min easy jog.", duration:42, distance:5.5, zone:"Zone 2", notes:"5-min intervals should feel sustainable — if not, you're going too fast." }
          }
        },
        { day:"Wed", type:"Run/Walk", duration:35, description:"Repeat Monday.",
          skill_variants:{
            novice:{ description:"Repeat Monday. The 90-second run gets easier today.", duration:30, distance:2.2, zone:"Zone 1", notes:"Wednesday of week 3 is often the hardest session in the whole program. Stay with it." },
            intermediate:{ description:"Repeat Monday. This is where most people feel the jump — push through.", duration:35, distance:3, zone:"Zone 2", notes:"Most people quit C25K in week 3. Showing up today separates you from most." },
            advanced:{ description:"Repeat Monday. Even pace across both 5-min intervals confirms your aerobic fitness.", duration:42, distance:5.5, zone:"Zone 2", notes:"Body adapts faster than the mind believes." }
          }
        },
        { day:"Fri", type:"Run/Walk", duration:35, description:"Repeat Monday. This is where most people feel the jump — push through.",
          skill_variants:{
            novice:{ description:"Repeat Monday. Week 3 done. Week 4 has 5-minute runs — you're more ready than you think.", duration:30, distance:2.2, zone:"Zone 1", notes:"Hardest psychological week is behind you." },
            intermediate:{ description:"Repeat Monday. 3 down, 5 to go. You're over the hump.", duration:35, distance:3, zone:"Zone 2", notes:"Intervals keep getting longer but you're building real fitness now." },
            advanced:{ description:"Repeat Monday. Strong week — feel the difference from week 1.", duration:42, distance:5.5, zone:"Zone 2", notes:"Aerobic base is taking hold." }
          }
        }
      ]},
      { week:4, theme:"Mixing it up", days:[
        { day:"Mon", type:"Run/Walk", duration:40, description:"5 min walk. 3 min jog, 90 sec walk, 5 min jog, 2.5 min walk, 3 min jog, 90 sec walk, 5 min jog. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. 2 min jog, 2 min walk, 3 min jog, 2 min walk — repeat twice. 5 min walk.", duration:32, distance:2.5, zone:"Zone 1", notes:"3-minute runs are your new normal. Slow and steady." },
            intermediate:{ description:"5 min walk. 3 min jog, 90 sec walk, 5 min jog, 2.5 min walk, 3 min jog, 90 sec walk, 5 min jog. 5 min walk.", duration:40, distance:3.5, zone:"Zone 2", notes:"First 5-minute interval — go out slow, you have 5 minutes to cover." },
            advanced:{ description:"5 min walk. 5 min jog, 60 sec walk, 8 min jog, 60 sec walk, 5 min jog + 4 strides. 5 min walk.", duration:48, distance:6.5, zone:"Zone 2 with strides", notes:"8 minutes continuous is the bridge to your first 20-min run next week." }
          }
        },
        { day:"Wed", type:"Run/Walk", duration:40, description:"Repeat Monday.",
          skill_variants:{
            novice:{ description:"Repeat Monday. You're halfway through the program.", duration:32, distance:2.5, zone:"Zone 1", notes:"Halfway. Look back at week 1 — you've come a long way." },
            intermediate:{ description:"Repeat Monday. Halfway there.", duration:40, distance:3.5, zone:"Zone 2", notes:"Midpoint of the program. The 5K is in sight." },
            advanced:{ description:"Repeat Monday. Hold even effort across both halves of each interval.", duration:48, distance:6.5, zone:"Zone 2 with strides", notes:"Negative splits habit starts now." }
          }
        },
        { day:"Fri", type:"Run/Walk", duration:40, description:"Repeat Monday. You're halfway there.",
          skill_variants:{
            novice:{ description:"Repeat Monday. Week 5 brings your first continuous run — you're ready.", duration:32, distance:2.5, zone:"Zone 1", notes:"The jump to continuous running is manageable at the right pace." },
            intermediate:{ description:"Repeat Monday. Week 5 incoming — 20 minutes straight. You're ready.", duration:40, distance:3.5, zone:"Zone 2", notes:"Trust the progression. Week 5 will confirm your fitness." },
            advanced:{ description:"Repeat Monday + strides. Aerobic base is strong going into breakthrough week.", duration:48, distance:6.5, zone:"Zone 2 with strides", notes:"Week 5 will confirm it." }
          }
        }
      ]},
      { week:5, theme:"Breakthrough week", days:[
        { day:"Mon", type:"Run", duration:40, description:"5 min walk. 5 min jog, 3 min walk, 5 min jog, 3 min walk, 5 min jog. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. 4 min jog, 3 min walk, 4 min jog, 3 min walk, 4 min jog. 5 min walk.", duration:35, distance:2.8, zone:"Zone 1-2", notes:"Three 4-minute runs at pure conversation pace." },
            intermediate:{ description:"5 min walk. 5 min jog, 3 min walk, 5 min jog, 3 min walk, 5 min jog. 5 min walk.", duration:40, distance:3.8, zone:"Zone 2", notes:"Three 5-minute blocks — if you can do three 5s, you can do one 15." },
            advanced:{ description:"5 min walk. 8 min jog, 2 min walk, 8 min jog, 2 min walk, 5 min jog + strides.", duration:48, distance:7, zone:"Zone 2 with strides", notes:"8-min blocks build toward Friday's first 20+ min continuous run." }
          }
        },
        { day:"Wed", type:"Run", duration:40, description:"5 min walk. 8 min jog, 5 min walk, 8 min jog. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. 5 min jog, 4 min walk, 5 min jog, 4 min walk, 3 min jog. 5 min walk.", duration:35, distance:2.8, zone:"Zone 1-2", notes:"Two 5-minute runs — you're almost ready for continuous." },
            intermediate:{ description:"5 min walk. 8 min jog, 5 min walk, 8 min jog. 5 min walk.", duration:40, distance:3.8, zone:"Zone 2", notes:"8 minutes — go slow enough you could hold this indefinitely." },
            advanced:{ description:"5 min walk. 12 min jog, 2 min walk, 10 min jog. 5 min walk.", duration:40, distance:6, zone:"Zone 2", notes:"Preparation for Friday's long run — stay fully aerobic." }
          }
        },
        { day:"Fri", type:"Long Run", duration:30, description:"5 min walk then 20 MINUTES CONTINUOUS JOG. Your first continuous run. Go slow.",
          skill_variants:{
            novice:{ description:"5 min walk then 15 MINUTES CONTINUOUS JOG. Your first continuous run. Embarrassingly slow.", duration:25, distance:2.5, zone:"Zone 1-2", notes:"15 nonstop minutes. Single biggest achievement in this program." },
            intermediate:{ description:"5 min walk then 20 MINUTES CONTINUOUS JOG. Slower than slow.", duration:30, distance:3.2, zone:"Zone 2", notes:"20 minutes nonstop. The pace does not matter. Finishing matters." },
            advanced:{ description:"5 min walk then 25 MINUTES CONTINUOUS JOG + 4 strides at the end.", duration:35, distance:4.5, zone:"Zone 2 with strides", notes:"25 continuous minutes confirms your aerobic base is real." }
          }
        }
      ]},
      { week:6, theme:"Building continuity", days:[
        { day:"Mon", type:"Run", duration:40, description:"5 min walk. 5 min jog, 3 min walk, 8 min jog, 3 min walk, 5 min jog. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. 5 min jog, 3 min walk, 6 min jog, 3 min walk, 5 min jog. 5 min walk.", duration:35, distance:3, zone:"Zone 1-2", notes:"Brief return to intervals builds your continuous-run stamina." },
            intermediate:{ description:"5 min walk. 5 min jog, 3 min walk, 8 min jog, 3 min walk, 5 min jog. 5 min walk.", duration:40, distance:3.8, zone:"Zone 2", notes:"8-min middle interval is your endurance anchor." },
            advanced:{ description:"5 min walk. 8 min jog, 2 min walk, 12 min jog, 2 min walk, 5 min jog + strides.", duration:46, distance:6, zone:"Zone 2 with strides", notes:"12-min block is approaching race duration — settle into race effort." }
          }
        },
        { day:"Wed", type:"Run", duration:40, description:"5 min walk. 10 min jog, 3 min walk, 10 min jog. 5 min walk.",
          skill_variants:{
            novice:{ description:"5 min walk. 8 min jog, 3 min walk, 8 min jog. 5 min walk.", duration:35, distance:3, zone:"Zone 1-2", notes:"Two 8-min runs — if hard, slow down. Speed is irrelevant right now." },
            intermediate:{ description:"5 min walk. 10 min jog, 3 min walk, 10 min jog. 5 min walk.", duration:40, distance:4, zone:"Zone 2", notes:"Two 10-min blocks — you can already run a 5K, just not all at once yet." },
            advanced:{ description:"5 min walk. 15 min jog, 2 min walk, 10 min jog + strides.", duration:42, distance:5.5, zone:"Zone 2 with strides", notes:"15-min block is now your standard." }
          }
        },
        { day:"Fri", type:"Long Run", duration:35, description:"5 min walk then 22 min continuous easy jog. Slow and steady.",
          skill_variants:{
            novice:{ description:"5 min walk then 18 min continuous easy jog.", duration:28, distance:2.8, zone:"Zone 1-2", notes:"18 continuous minutes — 2 more than last Friday. This is progress." },
            intermediate:{ description:"5 min walk then 22 min continuous easy jog. Slow and steady.", duration:35, distance:3.5, zone:"Zone 2", notes:"Every week you add a little more. Two weeks to race day." },
            advanced:{ description:"5 min walk then 28 min continuous jog. Last 5 minutes at comfortable 8:30/mile.", duration:40, distance:5, zone:"Zone 2-3", notes:"28 minutes — you're nearly ready to race a 5K right now." }
          }
        }
      ]},
      { week:7, theme:"Almost there", days:[
        { day:"Mon", type:"Easy Run", duration:25, description:"25 min continuous easy jog. You've got this.",
          skill_variants:{
            novice:{ description:"22 min continuous easy jog. Slowest comfortable pace.", duration:22, distance:2.8, zone:"Zone 1-2", notes:"22 straight minutes — you've run more than half of a 5K's time." },
            intermediate:{ description:"25 min continuous easy jog. You've got this.", duration:25, distance:3.5, zone:"Zone 2", notes:"Easy effort — save your legs for Friday." },
            advanced:{ description:"30 min continuous with last 5 min at 5K effort. 4 strides after.", duration:38, distance:5.5, zone:"Zone 2 to Zone 4", notes:"30 minutes continuous — above race distance. You're ready." }
          }
        },
        { day:"Wed", type:"Easy Run", duration:25, description:"25 min continuous easy jog.",
          skill_variants:{
            novice:{ description:"22 min continuous easy jog. Relax — you're almost there.", duration:22, distance:2.8, zone:"Zone 1-2", notes:"This run is about confidence, not fitness." },
            intermediate:{ description:"25 min continuous easy jog.", duration:25, distance:3.5, zone:"Zone 2", notes:"Penultimate training run. Keep it easy." },
            advanced:{ description:"28 min easy jog. Light tune-up before race day.", duration:28, distance:4.5, zone:"Zone 2", notes:"Stay aerobic — no strides today." }
          }
        },
        { day:"Fri", type:"Long Run", duration:28, description:"28 min continuous jog. Faster than week 6 if you can.",
          skill_variants:{
            novice:{ description:"25 min continuous jog. Slight pickup in the last 3 minutes.", duration:25, distance:3.2, zone:"Zone 1-2", notes:"Next week you run a 5K. This is your preparation run." },
            intermediate:{ description:"28 min continuous jog. Faster than week 6 if you can.", duration:28, distance:4, zone:"Zone 2-3", notes:"Race week next — easy Monday, shakeout Wednesday, race Friday." },
            advanced:{ description:"30 min easy jog with last 8 minutes at goal 5K race pace.", duration:35, distance:5.5, zone:"Zone 2 to Zone 4", notes:"Race simulation confirms your fitness." }
          }
        }
      ]},
      { week:8, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", duration:30, description:"30 min easy jog. Legs feel good — trust your training.",
          skill_variants:{
            novice:{ description:"20 min easy jog. Very slow. Just staying active.", duration:20, distance:2.5, zone:"Zone 1-2", notes:"Fitness is set — you can't improve it this week. Stay loose." },
            intermediate:{ description:"30 min easy jog. Legs feel good — trust your training.", duration:30, distance:3.5, zone:"Zone 2", notes:"Last training run. Easy. The work is done." },
            advanced:{ description:"25 min easy jog with 4 strides.", duration:28, distance:4, zone:"Zone 2 with strides", notes:"Strides wake up fast-twitch fibers for race day." }
          }
        },
        { day:"Wed", type:"Shakeout", duration:20, description:"20 min very easy jog. Just staying loose before race day.",
          skill_variants:{
            novice:{ description:"12 min very easy jog. Walk 2 min. Done.", duration:15, distance:1.5, zone:"Zone 1", notes:"Just keeping legs from feeling stiff on race day." },
            intermediate:{ description:"20 min very easy jog. Just staying loose before race day.", duration:20, distance:2.5, zone:"Zone 1-2", notes:"Race tomorrow. Drink water. Eat normally. Sleep 8 hours." },
            advanced:{ description:"15 min easy jog + 4 quality strides.", duration:20, distance:3, zone:"Zone 1-2 with strides", notes:"Strides on race eve prime the legs." }
          }
        },
        { day:"Fri", type:"RACE DAY", duration:30, description:"5K RACE. Start slow — slower than you think. Pick it up at 2km. Empty the tank in the last 500m.",
          skill_variants:{
            novice:{ description:"5K RACE. Run slow the first km. Pick up slightly at 2.5km. Last 500m — whatever you have left.", duration:40, distance:5, zone:"Zone 2-4", notes:"Finish is the only goal. Be proud the moment you cross that line." },
            intermediate:{ description:"5K RACE. Start slow — slower than you think. Pick it up at 2km. Empty the tank in the last 500m.", duration:30, distance:5, zone:"Zone 3-5", notes:"First km conservative, middle at race pace, last km give everything." },
            advanced:{ description:"5K RACE. First km at 8:30/mile. Middle at 8:00/mile. Last km sub-7:30.", duration:25, distance:5, zone:"Zone 4-5", notes:"Trust the training. Race." }
          }
        }
      ]}
    ]
  },

  "Sub-25 5K": {
    weeks: 8,
    goal: "Run 5K in under 25 minutes",
    targetPace: "8:00/mile",
    daysPerWeek: 4,
    runDays: ["Mon","Wed","Fri","Sat"],
    schedule: [
      { week:1, theme:"Base building", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy at fully conversational pace (9:30-10:00/mile). This should feel embarrassingly slow.",
          skill_variants:{
            novice:{ description:"3 miles very easy at 10:30-11:00/mile. Walk breaks every 5 min for 60 sec if needed.", duration:35, distance:3, zone:"Zone 1-2", notes:"Your easy pace is slower than you think — breathing hard means slow down." },
            intermediate:{ description:"4 miles easy at fully conversational pace (9:30-10:00/mile). This should feel embarrassingly slow.", duration:40, distance:4, zone:"Zone 2", notes:"Most people run their easy days too fast. Embarrassingly slow is correct." },
            advanced:{ description:"5 miles easy at 8:30-9:00/mile with 4×20 sec strides at the end.", duration:50, distance:5, zone:"Zone 2 with strides", notes:"Strides sharpen turnover without adding fatigue." }
          }
        },
        { day:"Wed", type:"Intervals", distance:6, duration:45, zone:"Zone 4-5", description:"1 mile easy warm up. 6x400m at 7:30/mile pace with 90 sec rest. 1 mile easy cool down.",
          skill_variants:{
            novice:{ description:"1 mile walk/jog warm up. 4×400m at conversational effort (9:00/mile). 90 sec walk rest. 1 mile walk/jog cool down.", duration:40, distance:4, zone:"Zone 2-3", notes:"First interval session — pace is about effort, not hitting splits." },
            intermediate:{ description:"1 mile easy warm up. 6×400m at 7:30/mile pace with 90 sec rest. 1 mile easy cool down.", duration:45, distance:6, zone:"Zone 4-5", notes:"First interval of each set always feels easy — resist going faster." },
            advanced:{ description:"1 mile warm up. 8×400m at 7:15/mile with 75 sec rest. 1 mile cool down.", duration:50, distance:7, zone:"Zone 4-5", notes:"8 reps is a real stimulus — nail the pace, don't exceed it." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy recovery. Very slow. Flush the legs from intervals.",
          skill_variants:{
            novice:{ description:"2 miles very easy jog. 60 sec walk every 8 min if needed.", duration:25, distance:2, zone:"Zone 1-2", notes:"Recovery day — slower than your Monday easy pace." },
            intermediate:{ description:"3 miles easy recovery. Very slow. Flush the legs from intervals.", duration:30, distance:3, zone:"Zone 2", notes:"Recovery run purpose is flushing Wednesday's lactate, nothing more." },
            advanced:{ description:"4 miles easy recovery. Zone 2 strictly.", duration:40, distance:4, zone:"Zone 2", notes:"Higher-mileage athletes need more recovery volume, not intensity." }
          }
        },
        { day:"Sat", type:"Long Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy conversational pace. Never race this run — it defeats the purpose.",
          skill_variants:{
            novice:{ description:"4 miles easy. Walk 90 sec every 10 min. Conversational the whole way.", duration:50, distance:4, zone:"Zone 1-2", notes:"Long run develops aerobic infrastructure. Slow is correct." },
            intermediate:{ description:"6 miles easy conversational pace. Never race this run — it defeats the purpose.", duration:65, distance:6, zone:"Zone 2", notes:"Conversational means you could hold a phone call." },
            advanced:{ description:"8 miles easy. Last mile at marathon pace (8:30-9:00/mile).", duration:80, distance:8, zone:"Zone 2", notes:"Marathon pace finish reinforces race effort without destroying recovery." }
          }
        }
      ]},
      { week:2, theme:"Adding tempo", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy.",
          skill_variants:{
            novice:{ description:"3 miles easy. Try continuous running — no walk breaks today.", duration:35, distance:3, zone:"Zone 1-2", notes:"Slow enough to make continuous possible." },
            intermediate:{ description:"4 miles easy.", duration:40, distance:4, zone:"Zone 2", notes:"Base day. Easy means easy." },
            advanced:{ description:"5 miles easy with 4 strides at end.", duration:50, distance:5, zone:"Zone 2 with strides", notes:"Strides maintain leg speed between quality sessions." }
          }
        },
        { day:"Wed", type:"Tempo", distance:4, duration:45, zone:"Zone 3-4", description:"1 mile warm up. 2 miles at 8:00/mile — comfortably hard, not racing. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile easy warm up. 1 mile at 9:30/mile (slightly uncomfortable). 1 mile easy cool down.", duration:35, distance:3, zone:"Zone 3", notes:"'Comfortably hard' means 3-4 words between breaths, not full sentences." },
            intermediate:{ description:"1 mile warm up. 2 miles at 8:00/mile — comfortably hard, not racing. 1 mile cool down.", duration:45, distance:4, zone:"Zone 3-4", notes:"Tempo pace should feel like 7/10 effort — controlled, not desperate." },
            advanced:{ description:"1 mile warm up. 3 miles at 7:45/mile. 1 mile cool down.", duration:48, distance:5, zone:"Zone 3-4", notes:"3-mile tempo at faster pace builds the lactate threshold your 5K depends on." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy recovery.",
          skill_variants:{
            novice:{ description:"2 miles very easy.", duration:25, distance:2, zone:"Zone 1-2", notes:"Flush Wednesday's tempo effort." },
            intermediate:{ description:"3 miles easy recovery.", duration:30, distance:3, zone:"Zone 2", notes:"Recovery run. Zone 2 only." },
            advanced:{ description:"4 miles easy recovery.", duration:40, distance:4, zone:"Zone 2", notes:"Recovery volume accelerates adaptation for higher-mileage athletes." }
          }
        },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy. Add 1 mile every week.",
          skill_variants:{
            novice:{ description:"5 miles easy with walk breaks as needed.", duration:60, distance:5, zone:"Zone 1-2", notes:"One step at a time toward the peak long run." },
            intermediate:{ description:"7 miles easy. Add 1 mile every week.", duration:75, distance:7, zone:"Zone 2", notes:"Long runs build the aerobic base that makes your 5K feel shorter." },
            advanced:{ description:"9 miles easy. Build to 12 miles by week 6.", duration:90, distance:9, zone:"Zone 2", notes:"Higher aerobic ceiling means faster 5K ceiling." }
          }
        }
      ]},
      { week:3, theme:"Speed development", days:[
        { day:"Mon", type:"Easy Run", distance:5, duration:50, zone:"Zone 2", description:"5 miles easy.",
          skill_variants:{
            novice:{ description:"3 miles easy continuous.", duration:35, distance:3, zone:"Zone 1-2", notes:"Easy pace starting to feel more natural." },
            intermediate:{ description:"5 miles easy.", duration:50, distance:5, zone:"Zone 2", notes:"Aerobic base continues to build." },
            advanced:{ description:"6 miles easy with 4 strides.", duration:60, distance:6, zone:"Zone 2 with strides", notes:"Volume accumulation supports faster Wednesday intervals." }
          }
        },
        { day:"Wed", type:"Intervals", distance:7, duration:50, zone:"Zone 4-5", description:"1 mile warm up. 8x400m at 7:15/mile pace. 90 sec rest between. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 5×400m at comfortable effort (9:00/mile). 2 min walk rest. 1 mile cool down.", duration:42, distance:4.5, zone:"Zone 3-4", notes:"5 reps is enough — quality over quantity at this stage." },
            intermediate:{ description:"1 mile warm up. 8×400m at 7:15/mile pace. 90 sec rest between. 1 mile cool down.", duration:50, distance:7, zone:"Zone 4-5", notes:"8 reps at faster pace — race effort on the last 2 reps only." },
            advanced:{ description:"1 mile warm up. 10×400m at 7:00/mile. 75 sec rest. 1 mile cool down.", duration:55, distance:8, zone:"Zone 4-5", notes:"10 reps at 7:00 builds sub-25 speed reserves." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy.",
          skill_variants:{
            novice:{ description:"2 miles very easy.", duration:25, distance:2, zone:"Zone 1-2", notes:"Easy recovery between quality sessions." },
            intermediate:{ description:"3 miles easy.", duration:30, distance:3, zone:"Zone 2", notes:"Zone 2. Nothing heroic." },
            advanced:{ description:"4 miles easy.", duration:40, distance:4, zone:"Zone 2", notes:"Active recovery accelerates adaptation." }
          }
        },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy.",
          skill_variants:{
            novice:{ description:"5 miles easy with walk breaks every 12 min.", duration:65, distance:5, zone:"Zone 1-2", notes:"Longest run so far — walk breaks without guilt." },
            intermediate:{ description:"7 miles easy.", duration:75, distance:7, zone:"Zone 2", notes:"Consistent long run pace." },
            advanced:{ description:"10 miles easy.", duration:100, distance:10, zone:"Zone 2", notes:"Double-digit long run — aerobic infrastructure expands significantly." }
          }
        }
      ]},
      { week:4, theme:"Recovery week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy. Recovery week — don't push.",
          skill_variants:{
            novice:{ description:"2.5 miles easy. Deload week — feel good.", duration:28, distance:2.5, zone:"Zone 1-2", notes:"Recovery weeks build in the adaptations from the last 3 weeks." },
            intermediate:{ description:"4 miles easy. Recovery week — don't push.", duration:40, distance:4, zone:"Zone 2", notes:"Deload week. You'll come back stronger next week." },
            advanced:{ description:"5 miles easy. Deload — reduce effort not volume.", duration:50, distance:5, zone:"Zone 2", notes:"Keep mileage moderate but effort very easy." }
          }
        },
        { day:"Wed", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy with 4x100m strides at end.",
          skill_variants:{
            novice:{ description:"3 miles easy. No strides this week.", duration:32, distance:3, zone:"Zone 1-2", notes:"Recovery week means easy — don't add intensity." },
            intermediate:{ description:"4 miles easy with 4×100m strides at end.", duration:40, distance:4, zone:"Zone 2", notes:"Strides maintain leg speed during deload without taxing the system." },
            advanced:{ description:"5 miles easy with 6×100m strides.", duration:50, distance:5, zone:"Zone 2 with strides", notes:"Strides keep legs sharp heading into the back half of the program." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles very easy.",
          skill_variants:{
            novice:{ description:"2 miles very easy.", duration:22, distance:2, zone:"Zone 1-2", notes:"Recovery week. Light and easy." },
            intermediate:{ description:"3 miles very easy.", duration:30, distance:3, zone:"Zone 2", notes:"Legs should feel progressively fresher this week." },
            advanced:{ description:"3 miles very easy.", duration:30, distance:3, zone:"Zone 2", notes:"Even advanced athletes benefit from true deload weeks." }
          }
        },
        { day:"Sat", type:"Long Run", distance:6, duration:60, zone:"Zone 2", description:"6 miles easy. Deload week — less is more.",
          skill_variants:{
            novice:{ description:"4 miles easy. Shorter long run this week.", duration:50, distance:4, zone:"Zone 1-2", notes:"Less is more during deload. You'll feel the benefit next week." },
            intermediate:{ description:"6 miles easy. Deload week — less is more.", duration:60, distance:6, zone:"Zone 2", notes:"Back to week 1 long run distance — that's the point." },
            advanced:{ description:"8 miles easy. Reduced from last week.", duration:80, distance:8, zone:"Zone 2", notes:"Deload is relative — still 8 miles but effort is lower." }
          }
        }
      ]},
      { week:5, theme:"Building back stronger", days:[
        { day:"Mon", type:"Easy Run", distance:5, duration:50, zone:"Zone 2", description:"5 miles easy.",
          skill_variants:{
            novice:{ description:"3.5 miles easy continuous.", duration:38, distance:3.5, zone:"Zone 1-2", notes:"Post-deload — legs should feel fresh. Don't overcook it." },
            intermediate:{ description:"5 miles easy.", duration:50, distance:5, zone:"Zone 2", notes:"Back to building after deload." },
            advanced:{ description:"6 miles easy with strides.", duration:60, distance:6, zone:"Zone 2 with strides", notes:"Deload paid off — legs should feel springy." }
          }
        },
        { day:"Wed", type:"Tempo", distance:5, duration:55, zone:"Zone 3-4", description:"1 mile warm up. 3 miles at 8:00/mile. 1 mile cool down. Sustained effort — you should be working.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 1.5 miles at 9:30/mile. 1 mile cool down.", duration:40, distance:3.5, zone:"Zone 3", notes:"Longer tempo than week 2 — same effort, slightly more distance." },
            intermediate:{ description:"1 mile warm up. 3 miles at 8:00/mile. 1 mile cool down. Sustained effort — you should be working.", duration:55, distance:5, zone:"Zone 3-4", notes:"3-mile tempo is the bread and butter of sub-25 training." },
            advanced:{ description:"1 mile warm up. 4 miles at 7:45/mile. 1 mile cool down.", duration:58, distance:6, zone:"Zone 3-4", notes:"4-mile tempo at faster pace — most demanding tempo of the program." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy.",
          skill_variants:{
            novice:{ description:"2.5 miles easy.", duration:28, distance:2.5, zone:"Zone 1-2", notes:"Post-tempo recovery." },
            intermediate:{ description:"4 miles easy.", duration:40, distance:4, zone:"Zone 2", notes:"Flush Wednesday's tempo. Easy means easy." },
            advanced:{ description:"5 miles easy.", duration:50, distance:5, zone:"Zone 2", notes:"Higher mileage recovery supports more adaptation." }
          }
        },
        { day:"Sat", type:"Long Run", distance:8, duration:85, zone:"Zone 2", description:"8 miles easy.",
          skill_variants:{
            novice:{ description:"6 miles easy with walk breaks every 12 min.", duration:72, distance:6, zone:"Zone 1-2", notes:"6 miles is a genuine long run at this stage — respect it." },
            intermediate:{ description:"8 miles easy.", duration:85, distance:8, zone:"Zone 2", notes:"Hold the conversational pace all the way through." },
            advanced:{ description:"11 miles easy.", duration:108, distance:11, zone:"Zone 2", notes:"These miles make the 5K feel short." }
          }
        }
      ]},
      { week:6, theme:"Peak training", days:[
        { day:"Mon", type:"Easy Run", distance:5, duration:50, zone:"Zone 2", description:"5 miles easy.",
          skill_variants:{
            novice:{ description:"4 miles easy.", duration:44, distance:4, zone:"Zone 1-2", notes:"Peak week begins. Keep easy days truly easy." },
            intermediate:{ description:"5 miles easy.", duration:50, distance:5, zone:"Zone 2", notes:"Peak training week — save it for Wednesday." },
            advanced:{ description:"6 miles easy with strides.", duration:60, distance:6, zone:"Zone 2 with strides", notes:"Priming legs before the hardest session of the program." }
          }
        },
        { day:"Wed", type:"Intervals", distance:9, duration:60, zone:"Zone 4", description:"1 mile warm up. 6x800m at 7:45/mile with 2 min rest. 1 mile cool down. Toughest session of the program.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 4×600m at 9:00/mile with 2 min rest. 1 mile cool down.", duration:48, distance:5.5, zone:"Zone 3-4", notes:"600m reps at controlled effort — more than you've done before." },
            intermediate:{ description:"1 mile warm up. 6×800m at 7:45/mile with 2 min rest. 1 mile cool down. Toughest session of the program.", duration:60, distance:9, zone:"Zone 4", notes:"First rep should feel almost too easy. Last rep should be genuinely hard." },
            advanced:{ description:"1 mile warm up. 6×1000m at 7:30/mile with 90 sec rest. 1 mile cool down.", duration:65, distance:10, zone:"Zone 4", notes:"1000m reps simulate race-length efforts — this is where sub-25 is built." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy.",
          skill_variants:{
            novice:{ description:"3 miles easy recovery.", duration:33, distance:3, zone:"Zone 1-2", notes:"Easy recovery after peak interval session." },
            intermediate:{ description:"4 miles easy.", duration:40, distance:4, zone:"Zone 2", notes:"Recovery from toughest session. Easy only." },
            advanced:{ description:"5 miles easy.", duration:50, distance:5, zone:"Zone 2", notes:"Flush the 1000m reps — you need this recovery." }
          }
        },
        { day:"Sat", type:"Long Run", distance:8, duration:85, zone:"Zone 2", description:"8 miles easy. Peak long run.",
          skill_variants:{
            novice:{ description:"6 miles easy. Peak long run for this program.", duration:72, distance:6, zone:"Zone 1-2", notes:"Walk breaks are fine — you're still building." },
            intermediate:{ description:"8 miles easy. Peak long run.", duration:85, distance:8, zone:"Zone 2", notes:"Taper starts next week — this is the top." },
            advanced:{ description:"12 miles easy. Peak long run.", duration:115, distance:12, zone:"Zone 2", notes:"Aerobic engine is now fully tuned." }
          }
        }
      ]},
      { week:7, theme:"Taper begins", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy. Taper begins — trust it.",
          skill_variants:{
            novice:{ description:"3 miles easy. Taper — you're ready.", duration:33, distance:3, zone:"Zone 1-2", notes:"Less running this week is correct." },
            intermediate:{ description:"4 miles easy. Taper begins — trust it.", duration:40, distance:4, zone:"Zone 2", notes:"Taper is about recovery, not fitness. You're already fit." },
            advanced:{ description:"5 miles easy with 4 strides.", duration:50, distance:5, zone:"Zone 2 with strides", notes:"Strides maintain sharpness during the taper." }
          }
        },
        { day:"Wed", type:"Tempo", distance:4, duration:45, zone:"Zone 3-4", description:"1 mile warm up. 2 miles at race pace 8:00/mile. 1 mile cool down. Sharp but short.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 1 mile at 9:30/mile. 1 mile cool down.", duration:35, distance:3, zone:"Zone 3", notes:"Short tempo — remind your legs what effort feels like before race day." },
            intermediate:{ description:"1 mile warm up. 2 miles at race pace 8:00/mile. 1 mile cool down. Sharp but short.", duration:45, distance:4, zone:"Zone 3-4", notes:"Race pace preview — should feel controlled, not desperate." },
            advanced:{ description:"1 mile warm up. 2 miles at 7:45/mile + 4×400m at 7:15/mile. 1 mile cool down.", duration:50, distance:5.5, zone:"Zone 3-5", notes:"Tempo plus speed work confirms race readiness." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy.",
          skill_variants:{
            novice:{ description:"2 miles easy.", duration:22, distance:2, zone:"Zone 1-2", notes:"Taper Friday — short and easy." },
            intermediate:{ description:"3 miles easy.", duration:30, distance:3, zone:"Zone 2", notes:"Last easy run before race weekend." },
            advanced:{ description:"3 miles easy.", duration:30, distance:3, zone:"Zone 2", notes:"Even advanced athletes run easy on taper Friday." }
          }
        },
        { day:"Sat", type:"Long Run", distance:6, duration:60, zone:"Zone 2", description:"6 miles easy. Taper — you're doing less because you're already fit.",
          skill_variants:{
            novice:{ description:"4 miles easy. Taper long run.", duration:48, distance:4, zone:"Zone 1-2", notes:"Reduction is deliberate — fitness is already built." },
            intermediate:{ description:"6 miles easy. Taper — you're doing less because you're already fit.", duration:60, distance:6, zone:"Zone 2", notes:"That gap from 8 miles is where your race fitness lives." },
            advanced:{ description:"8 miles easy.", duration:80, distance:8, zone:"Zone 2", notes:"Reduced from 12 — taper effect will make race day feel explosive." }
          }
        }
      ]},
      { week:8, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles very easy. Feel how fresh your legs are.",
          skill_variants:{
            novice:{ description:"2 miles very easy. Race week!", duration:22, distance:2, zone:"Zone 1-2", notes:"Short, easy, done. Race is almost here." },
            intermediate:{ description:"3 miles very easy. Feel how fresh your legs are.", duration:30, distance:3, zone:"Zone 2", notes:"Fresh legs confirm the taper is working." },
            advanced:{ description:"4 miles easy with 4 strides. Legs should feel electric.", duration:40, distance:4, zone:"Zone 2 with strides", notes:"Final tune-up." }
          }
        },
        { day:"Wed", type:"Shakeout", distance:2, duration:25, zone:"Zone 2", description:"2 miles easy with 4x strides. Legs should feel electric.",
          skill_variants:{
            novice:{ description:"1.5 miles easy jog. Done.", duration:18, distance:1.5, zone:"Zone 1-2", notes:"Keep it short. Sleep and eat well tonight." },
            intermediate:{ description:"2 miles easy with 4×strides. Legs should feel electric.", duration:25, distance:2, zone:"Zone 2 with strides", notes:"Strides on race eve activate fast-twitch fibers." },
            advanced:{ description:"2 miles easy with 6×strides.", duration:25, distance:2.5, zone:"Zone 2 with strides", notes:"Final shakeout. Race tomorrow. You're ready." }
          }
        },
        { day:"Fri", type:"Rest", duration:0, description:"Complete rest. Eat well. Drink water. Sleep 8+ hours.",
          skill_variants:{
            novice:{ description:"Complete rest. Eat carbs. Drink water. Sleep 8+ hours.", duration:0, distance:0, zone:"Rest", notes:"Nothing you do today makes you fitter. Nothing you do wrong won't hurt tomorrow." },
            intermediate:{ description:"Complete rest. Eat well. Drink water. Sleep 8+ hours.", duration:0, distance:0, zone:"Rest", notes:"Hydrate, light carb-focused dinner, in bed by 10pm." },
            advanced:{ description:"Complete rest. Carb load. Hydrate. 8 hours sleep minimum.", duration:0, distance:0, zone:"Rest", notes:"60-80g carbs at dinner. Gear laid out tonight." }
          }
        },
        { day:"Sat", type:"RACE DAY", duration:25, description:"Sub-25 5K. Mile 1: 8:10 — don't go out too fast. Mile 2: 8:00 — settle in. Last 1.1 miles: empty the tank. You're ready.",
          skill_variants:{
            novice:{ description:"5K RACE. Goal: finish. Pace: 9:30-10:00/mile. Walk if you need to — keep moving forward.", duration:35, distance:5, zone:"Zone 3-4", notes:"You did the work. Cross the finish line." },
            intermediate:{ description:"Sub-25 5K. Mile 1: 8:10. Mile 2: 8:00. Last 1.1 miles: empty the tank.", duration:25, distance:5, zone:"Zone 4-5", notes:"Conservative first mile is the most important thing. Everyone goes out too fast." },
            advanced:{ description:"Sub-23 target. Mile 1: 7:30. Mile 2: 7:20. Mile 3.1: give everything.", duration:23, distance:5, zone:"Zone 4-5", notes:"Patience in mile 1 is the whole race plan." }
          }
        }
      ]}
    ]
  },

  "10K Training": {
    weeks: 10,
    goal: "Complete a 10K strong",
    targetPace: "10:00/mile",
    daysPerWeek: 4,
    runDays: ["Mon","Wed","Fri","Sat"],
    schedule: [
      { week:1, theme:"Foundation", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy. Start conservative." },
        { day:"Wed", type:"Intervals", distance:5, duration:45, zone:"Zone 4", description:"1 mile warm up. 5x400m at goal pace with 90 sec rest. 1 mile cool down." },
        { day:"Fri", type:"Easy Run", distance:3, duration:33, zone:"Zone 2", description:"3 miles easy recovery." },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy. Build 1 mile per week." }
      ]},
      { week:5, theme:"Mid-program push", days:[
        { day:"Mon", type:"Easy Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy." },
        { day:"Wed", type:"Tempo", distance:6, duration:65, zone:"Zone 3-4", description:"1 mile warm up. 4 miles at 9:30/mile. 1 mile cool down." },
        { day:"Fri", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy." },
        { day:"Sat", type:"Long Run", distance:11, duration:120, zone:"Zone 2", description:"11 miles easy. Getting comfortable at distance." }
      ]},
      { week:10, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy. Taper — you're ready." },
        { day:"Wed", type:"Shakeout", distance:3, duration:33, zone:"Zone 2", description:"3 miles with 4 strides. Sharp and fresh." },
        { day:"Fri", type:"Rest", duration:0, description:"Complete rest." },
        { day:"Sat", type:"RACE DAY", duration:65, description:"10K race. First 2km conservative. Middle 4km at goal pace. Last 4km — give everything." }
      ]}
    ]
  },

  "Half Marathon": {
    weeks: 16,
    goal: "Complete Half Marathon",
    targetPace: "10:00/mile",
    daysPerWeek: 4,
    runDays: ["Mon","Wed","Thu","Sat"],
    schedule: [
      { week:1, theme:"Base", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:45, zone:"Zone 2", description:"4 miles easy. Build your aerobic base." },
        { day:"Wed", type:"Tempo", distance:5, duration:55, zone:"Zone 3", description:"1 mile warm up. 3 miles at comfortably hard pace. 1 mile cool down." },
        { day:"Thu", type:"Easy Run", distance:3, duration:33, zone:"Zone 2", description:"3 miles easy recovery." },
        { day:"Sat", type:"Long Run", distance:8, duration:90, zone:"Zone 2", description:"8 miles easy. This builds to 11 miles at peak." }
      ]},
      { week:8, theme:"Peak training", days:[
        { day:"Mon", type:"Easy Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy." },
        { day:"Wed", type:"Tempo", distance:8, duration:85, zone:"Zone 3", description:"1 mile warm up. 6 miles at goal half marathon pace. 1 mile cool down." },
        { day:"Thu", type:"Easy Run", distance:5, duration:55, zone:"Zone 2", description:"5 miles easy." },
        { day:"Sat", type:"Long Run", distance:11, duration:125, zone:"Zone 2", description:"11 miles easy. Peak long run. Fuel practice — take a gel at mile 5." }
      ]},
      { week:16, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:45, zone:"Zone 2", description:"4 miles easy taper." },
        { day:"Wed", type:"Shakeout", distance:3, duration:33, zone:"Zone 2", description:"3 miles with strides." },
        { day:"Thu", type:"Rest", duration:0, description:"Rest. Carb load. Hydrate." },
        { day:"Sat", type:"RACE DAY", duration:130, description:"Half Marathon. Miles 1-3: slower than goal pace. Miles 4-10: goal pace. Miles 11-13.1: empty the tank." }
      ]}
    ]
  }
};

// ── HYROX ─────────────────────────────────────────────────────────────────────
export const HYROX_STATIONS = [
  { name:"SkiErg", distance:"1000m", tip:"Arms pull down hard, hinge at hips, sustainable pace. Don't blow up here." },
  { name:"Sled Push", distance:"50m", tip:"Low hips, drive with legs, short fast steps. Lean into it." },
  { name:"Sled Pull", distance:"50m", tip:"Hand over hand, lean back, use your bodyweight." },
  { name:"Burpee Broad Jump", distance:"80m", tip:"Jump forward not up. Land soft. Drop immediately. Rhythm over speed." },
  { name:"Row", distance:"1000m", tip:"Legs first, lean back, pull arms last. 500m split × 2 = your time." },
  { name:"Farmers Carry", distance:"200m", tip:"Shoulders back, core tight. Walk don't run — you'll pay for it later." },
  { name:"Sandbag Lunges", distance:"100m", tip:"Bag on shoulder, long stride, knee just above floor. Breathe." },
  { name:"Wall Balls", reps:"75 women / 100 men", tip:"Full squat every rep. Ball hits target. Catch and drop immediately. Unbroken if possible." }
];

export const HYROX_PROGRAM = {
  "12-Week Race Prep": {
    weeks: 12,
    goal: "Complete Hyrox and hit your target time",
    structure: "3 strength days + 2 run days + 1 station day + 1 rest",
    weeks_detail: [
      { week:1, focus:"Assessment & Foundation", days:[
        { day:"Mon", type:"Strength", duration:60, description:"Squat 4×8, Deadlift 4×6, Overhead Press 3×10, Pull Up 3×8, Farmers Carry 3×40m. Build the engine." },
        { day:"Tue", type:"Run", distance:5, duration:30, description:"5km easy run. Establish baseline. Note your pace — you'll race this at week 12." },
        { day:"Wed", type:"Station Work", duration:60, description:"SkiErg 4×250m with 2 min rest. Row 4×250m with 2 min rest. TECHNIQUE only — go slow and learn the machines." },
        { day:"Thu", type:"Rest", description:"Complete rest or 20 min walk." },
        { day:"Fri", type:"Strength", duration:60, description:"Farmers Carry 4×50m heavy, Sled Push 4×20m, Sandbag Lunge 3×20m, Wall Ball 3×20, Burpee Broad Jump 3×10m." },
        { day:"Sat", type:"Long Run", distance:8, duration:50, description:"8km easy — conversational pace the whole way. This builds to 12km at peak." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:4, focus:"Increasing Intensity", days:[
        { day:"Mon", type:"Strength", duration:65, description:"Squat 5×5, Deadlift 3×4, Overhead Press 4×6, Pull Up 4×6, Farmers Carry 4×50m. Getting heavier." },
        { day:"Tue", type:"Run Intervals", distance:8, duration:55, description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. Exactly simulates Hyrox run segments." },
        { day:"Wed", type:"Station Circuit", duration:60, description:"SkiErg 750m, rest 3 min, Row 750m, rest 3 min, Wall Ball 3×25, rest 2 min, Burpee Broad Jump 40m. Building station capacity." },
        { day:"Thu", type:"Recovery", description:"20 min easy walk, mobility work, foam rolling. Non-negotiable recovery." },
        { day:"Fri", type:"Strength", duration:60, description:"Sled Push 6×20m, Sled Pull 4×20m, Sandbag Lunge 4×25m, Farmers Carry 4×50m." },
        { day:"Sat", type:"Long Run", distance:10, duration:65, description:"10km easy. Aerobic base matters more than people think for Hyrox." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:8, focus:"Race Simulation", days:[
        { day:"Mon", type:"Strength", duration:65, description:"Heavy compounds peak week — Squat 5×3, Deadlift 3×3, Press 4×4. Strength should be peaking." },
        { day:"Tue", type:"Run", distance:8, duration:50, description:"8km with middle 4km at race pace." },
        { day:"Wed", type:"Half Hyrox Simulation", duration:70, description:"Run 1km, SkiErg 500m, Run 1km, Sled Push 25m, Run 1km, Row 500m, Run 1km, Wall Ball 50 reps. RACE EFFORT. This is your test." },
        { day:"Thu", type:"Recovery", description:"Full recovery — this is mandatory after the simulation." },
        { day:"Fri", type:"Station Repeats", duration:55, description:"Farmers Carry 6×50m, Sandbag Lunge 4×25m, Burpee Broad Jump 4×20m. Weakness work." },
        { day:"Sat", type:"Long Run", distance:12, duration:75, description:"12km easy. Peak long run." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:10, focus:"Full Race Simulation", days:[
        { day:"Mon", type:"Strength", duration:55, description:"Moderate strength — maintain, don't build. Last heavy week." },
        { day:"Tue", type:"Run Intervals", distance:7, duration:50, description:"4×1km at race pace. Sharpening." },
        { day:"Wed", type:"FULL HYROX SIMULATION", duration:90, description:"Complete race simulation. All 8 stations with 1km runs between each. Race pace. Note your time — this predicts race day." },
        { day:"Thu", type:"Rest", description:"2 days full rest after simulation." },
        { day:"Fri", type:"Rest", description:"Full rest." },
        { day:"Sat", type:"Easy Run", distance:8, duration:50, description:"8km very easy. Flush the legs." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:12, focus:"Race Week — TAPER", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:25, description:"4km very easy. Just moving." },
        { day:"Tue", type:"Shakeout Stations", duration:30, description:"1 round of each station at 50% effort. Just feeling the movements." },
        { day:"Wed", type:"Rest", description:"Complete rest." },
        { day:"Thu", type:"Rest", description:"Complete rest. Eat well. 9 hours sleep." },
        { day:"Fri", type:"Rest", description:"Full rest. Carb load. Hydrate. Lay out your gear." },
        { day:"Sat", type:"RACE DAY — HYROX", description:"Race day. Pace the first 2 runs conservatively — everyone goes out too fast. Attack the stations with good technique. Leave everything on the floor." },
        { day:"Sun", type:"Recovery", description:"You earned it. Eat, sleep, reflect." }
      ]}
    ]
  }
};

// ── HYBRID ─────────────────────────────────────────────────────────────────────
export const HYBRID_PROGRAMS = {
  "Strength-Biased Hybrid": {
    goal: "Maintain serious strength while building real running fitness",
    weeks: 12,
    daysPerWeek: 6,
    structure: "3 lift days + 3 run days",
    liftDays: ["Mon","Wed","Fri"],
    runDays: ["Tue","Thu","Sat"],
    weekly_structure: [
      { day:"Mon", type:"Lift", focus:"Push", duration:60, description:"Bench Press 4×4-6, Overhead Press 4×4-6, Incline DB Press 3×8-10, Lateral Raise 4×12-15, Tricep Pushdown 3×10-12. Heavy. Progressive overload." },
      { day:"Tue", type:"Easy Run", distance:5, duration:30, zone:"Zone 2", description:"5km fully conversational. If you can't hold a conversation you're going too fast. This is recovery, not training." },
      { day:"Wed", type:"Lift", focus:"Pull", duration:60, description:"Deadlift 4×3-5, Barbell Row 4×4-6, Pull Up 3×6-8, Face Pull 3×20, Barbell Curl 3×8-10. Add weight when all reps are clean." },
      { day:"Thu", type:"Tempo Run", distance:8, duration:50, zone:"Zone 3-4", description:"1km warm up easy. 6km at comfortably hard pace (7/10 effort). 1km cool down. Sustained threshold work." },
      { day:"Fri", type:"Lift", focus:"Legs", duration:60, description:"Squat 4×4-6, Romanian Deadlift 3×6-8, Leg Press 3×10-12, Leg Curl 3×12-15, Calf Raise 4×15. Squat is king." },
      { day:"Sat", type:"Long Run", distance:14, duration:90, zone:"Zone 2", description:"Start at 12km. Add 1km per week up to 20km. Conversational pace the ENTIRE run. This is not a race. Fueling practice." },
      { day:"Sun", type:"Rest", description:"Complete rest. This is where adaptation happens. Don't skip it." }
    ],
    progression: "Long run adds 1km per week. Lifts add 5lbs on primary movements when all reps are clean. Week 4, 8, 12 are deload — reduce run volume 40%, keep lift intensity.",
    nutrition_bridge: "Lift days: carbs up for performance and recovery. Long run day: carb load the night before, take carbs during if over 90 min. Easy run days: standard macros. This is exactly what your Coach Macro budget adjusts for automatically."
  },

  "Run-Biased Hybrid": {
    goal: "Serious runner who wants functional strength without compromising running",
    weeks: 16,
    daysPerWeek: 6,
    structure: "2 lift days + 5 run days",
    liftDays: ["Tue","Sun"],
    runDays: ["Mon","Wed","Thu","Fri","Sat"],
    weekly_structure: [
      { day:"Mon", type:"Easy Run", distance:8, duration:50, zone:"Zone 2", description:"8km easy Zone 2. Sets the week up. Fully conversational." },
      { day:"Tue", type:"Lift", focus:"Full Body Heavy", duration:45, description:"Squat 3×5, Deadlift 2×5, Bench Press 3×5, Barbell Row 3×5. HEAVY COMPOUNDS ONLY. 45 minutes max. No isolation work — it kills your running legs." },
      { day:"Wed", type:"Intervals", distance:10, duration:65, zone:"Zone 5", description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. The quality session. Protect this at all costs." },
      { day:"Thu", type:"Easy Run", distance:6, duration:40, zone:"Zone 2", description:"6km easy recovery. Very slow. Flush the legs from intervals. This is not optional." },
      { day:"Fri", type:"Tempo Run", distance:8, duration:55, zone:"Zone 3-4", description:"2km warm up. 5km at half marathon pace. 1km cool down. Sustained effort." },
      { day:"Sat", type:"Long Run", distance:22, duration:145, zone:"Zone 2", description:"Long run. Start at 18km. Builds to 26km. Conversational pace. Practice fueling — gel every 45 min." },
      { day:"Sun", type:"Lift", focus:"Full Body Heavy", duration:45, description:"Same as Tuesday. Squat 3×5, Deadlift 2×5, Bench 3×5, Row 3×5. Quick, heavy, done." }
    ],
    progression: "Run volume builds maximum 10% per week. Lifts add 5lbs weekly — strength must progress or the program fails. Keep strength sessions exactly 45 min — running legs cannot afford more.",
    nutrition_bridge: "Long run day: 8g carbs per kg bodyweight the night before. Lift days: 2.2g protein per kg. Interval day: 60-80g carbs 2 hours before. Easy days: standard macros. Coach Macro adjusts this automatically based on what's on your schedule."
  },

  "Balanced Hybrid": {
    goal: "Equally strong and fast — no compromise on either quality",
    weeks: 12,
    daysPerWeek: 6,
    structure: "3 lift days + 3 run days — alternating",
    liftDays: ["Mon","Wed","Fri"],
    runDays: ["Tue","Thu","Sat"],
    weekly_structure: [
      { day:"Mon", type:"Lift", focus:"Upper Body Strength", duration:65, description:"Bench Press 4×3-5, Barbell Row 4×3-5, Overhead Press 3×5-6, Pull Up 3×5-8. Heavy compounds. This is your strength day — treat it seriously." },
      { day:"Tue", type:"Speed Work", distance:7, duration:50, zone:"Zone 5", description:"Track session: 1km warm up. 8×400m at mile pace with 60 sec rest. 1km cool down. Pure speed development. This is what makes you fast." },
      { day:"Wed", type:"Lift", focus:"Lower Body Strength", duration:65, description:"Squat 5×3-5, Romanian Deadlift 4×5, Bulgarian Split Squat 3×8 each, Leg Curl 3×12, Calf Raise 4×15. Squat heavy — this is your engine." },
      { day:"Thu", type:"Easy Run", distance:8, duration:55, zone:"Zone 2", description:"8km easy Zone 2. Active recovery. Never push this run — it undoes the whole program if you do." },
      { day:"Fri", type:"Lift", focus:"Power + Athletic", duration:65, description:"Power Clean 4×3, Box Jump 4×5, Farmers Carry 4×50m, Sled Push 3×20m, Sandbag Carry 3×30m. Athletic power work — this is what connects strength to sport." },
      { day:"Sat", type:"Long Run", distance:18, duration:120, zone:"Zone 2", description:"Long run. Start 14km, build to 22km. Conversational pace. This is where hybrid athletes separate themselves from people who just lift or just run." },
      { day:"Sun", type:"Rest", description:"Non-negotiable full rest. 9 hours sleep target." }
    ],
    progression: "Lifts add weight every session when reps are clean. Running adds 1km to long run every week, 1 interval rep per month. Deload weeks 4 and 8 — reduce everything 40%.",
    nutrition_bridge: "This program has the highest nutrition complexity. Heavy lift days: 4g carbs/kg for performance. Long run day: carb load night before. Rest days: drop carbs 25-30%. Protein stays 2.2g/kg every single day. Coach Macro handles all of this automatically based on your daily schedule."
  },

  "Hyrox Hybrid": {
    goal: "Compete in Hyrox — strong, fast, and station-ready",
    weeks: 12,
    daysPerWeek: 6,
    structure: "2 strength + 2 run + 1 station + 1 long run",
    liftDays: ["Mon","Wed"],
    runDays: ["Tue","Thu"],
    stationDays: ["Fri"],
    longRunDays: ["Sat"],
    weekly_structure: [
      { day:"Mon", type:"Lift", focus:"Strength Foundation", duration:65, description:"Squat 4×5, Deadlift 3×4, Overhead Press 4×5, Pull Up 4×6, Farmers Carry 3×40m. The strength base that powers every Hyrox station. Go heavy." },
      { day:"Tue", type:"Run", distance:8, duration:50, description:"8km with middle 4km at Hyrox race pace. You run 8km total in Hyrox between stations — this is exactly what you're training." },
      { day:"Wed", type:"Lift", focus:"Upper Strength + Station Carry-Over", duration:65, description:"Bench Press 4×5, Barbell Row 4×5, Sandbag Lunge 4×20m, Sled Push 3×20m, Wall Ball 3×20. Direct Hyrox station carry-over built into the lift day." },
      { day:"Thu", type:"Run Intervals", distance:9, duration:60, description:"6×1km at 5K pace with 90 sec rest. Hyrox requires repeated 1km efforts between stations — this is exactly that training." },
      { day:"Fri", type:"Station Circuit", duration:65, description:"SkiErg 1000m, rest 3 min, Row 1000m, rest 3 min, Burpee Broad Jump 50m, rest 3 min, Wall Ball 50 reps, rest 3 min. Station-specific conditioning. This gets harder every week." },
      { day:"Sat", type:"Long Run", distance:12, duration:75, description:"10-14km easy. Aerobic base. Hyrox is 60-80% aerobic — this matters more than most people think." },
      { day:"Sun", type:"Rest", description:"Complete rest. This program is high volume. Sleep is training." }
    ],
    race_simulations: [
      { week:8, description:"Half Hyrox — Run 4×1km with stations SkiErg, Row, Wall Ball, Farmers Carry at race effort" },
      { week:10, description:"Full Hyrox simulation — all 8 stations with 1km runs between each at race pace" },
      { week:12, description:"Race week taper — light work Monday through Friday, race Saturday" }
    ],
    progression: "Stations: add reps or distance every 2 weeks. Running: add 1km to long run weekly. Lifts: heavy and consistent — strength peaks at week 10. Full taper weeks 11-12.",
    nutrition_bridge: "Highest carb demands of any program. Station days and long run day: 5-6g carbs/kg. Race week: carb load Thursday-Friday. Race morning: 80-100g carbs 2 hours before start. Coach Macro tracks all of this and adjusts your daily budget accordingly."
  }
};

// ── HELPER FUNCTIONS ───────────────────────────────────────────────────────────
export function getSkillVariant(programData, skillLevel) {
  const map = { 'beginner':'novice','novice':'novice','intermediate':'intermediate','advanced':'advanced','elite':'advanced' };
  const key = map[skillLevel?.toLowerCase()] || 'intermediate';
  if (programData[key]) return programData[key];
  if (programData.intermediate) return programData.intermediate;
  return programData;
}

export function getTodayRunWorkout(programName, weekNumber, dayOfWeek) {
  const program = RUNNING_PROGRAMS[programName];
  if(!program) return null;
  const week = program.schedule.find(w=>w.week===weekNumber);
  if(!week) return null;
  return week.days.find(d=>d.day===dayOfWeek)||null;
}

export function getTodayHyroxWorkout(weekNumber, dayOfWeek) {
  const program = HYROX_PROGRAM["12-Week Race Prep"];
  const week = program.weeks_detail.find(w=>w.week===weekNumber);
  if(!week) return null;
  return week.days.find(d=>d.day===dayOfWeek)||null;
}

export function getTodayHybridWorkout(templateName, dayOfWeek, weekNumber) {
  const template = HYBRID_PROGRAMS[templateName];
  if(!template) return null;
  const todayPlan = template.weekly_structure.find(d=>d.day===dayOfWeek);
  if(!todayPlan) return { type:"Rest", description:"Rest day. Recover and prepare for tomorrow.", duration:0 };

  if(template.race_simulations){
    const sim = template.race_simulations.find(s=>s.week===weekNumber);
    if(sim && dayOfWeek==="Wed") return { ...todayPlan, raceSimulation:sim.description };
  }

  return { ...todayPlan, nutritionBridge:template.nutrition_bridge };
}

export function getProgramForUser(wPrefs) {
  if(wPrefs?.isHyrox && wPrefs?.isHybrid) return { type:"hyrox-hybrid", program:HYBRID_PROGRAMS["Hyrox Hybrid"] };
  if(wPrefs?.isHyrox) return { type:"hyrox", program:HYROX_PROGRAM["12-Week Race Prep"] };
  if(wPrefs?.isHybrid) {
    const template = wPrefs?.hybridTemplate || "Balanced Hybrid";
    return { type:"hybrid", program:HYBRID_PROGRAMS[template] };
  }
  if(wPrefs?.splitType?.toLowerCase().includes("run")) {
    const runPlan = wPrefs?.runPlan || "Couch to 5K";
    return { type:"running", program:RUNNING_PROGRAMS[runPlan] };
  }
  return { type:"lifting", program:null };
}
