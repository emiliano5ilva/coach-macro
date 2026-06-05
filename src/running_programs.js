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
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles at {easy}. Fully conversational — this should feel embarrassingly slow.",
          skill_variants:{
            novice:{ description:"3 miles at {easy}. Walk 60 sec every 5 min if needed.", duration:35, distance:3, zone:"Zone 1-2", notes:"Your easy pace is slower than you think — breathing hard means slow down." },
            intermediate:{ description:"4 miles at {easy}. Fully conversational — this should feel embarrassingly slow.", duration:40, distance:4, zone:"Zone 2", notes:"Most people run their easy days too fast. Embarrassingly slow is correct." },
            advanced:{ description:"5 miles at {easy} with 4×20 sec strides at the end.", duration:50, distance:5, zone:"Zone 2 with strides", notes:"Strides sharpen turnover without adding fatigue." }
          }
        },
        { day:"Wed", type:"Intervals", distance:6, duration:45, zone:"Zone 4-5", description:"1 mile warm up at {easy}. 6×400m at {interval5K} with 90 sec rest. 1 mile cool down at {easy}.",
          skill_variants:{
            novice:{ description:"1 mile warm up at {easy}. 4×400m at {interval5K} with 2 min walk rest. 1 mile cool down.", duration:40, distance:4, zone:"Zone 2-3", notes:"First interval session — focus on effort, not pace numbers." },
            intermediate:{ description:"1 mile warm up at {easy}. 6×400m at {interval5K} with 90 sec rest. 1 mile cool down at {easy}.", duration:45, distance:6, zone:"Zone 4-5", notes:"First interval of each set always feels easy — resist going faster." },
            advanced:{ description:"1 mile warm up. 8×400m at {interval1mi} with 75 sec rest. 1 mile cool down.", duration:50, distance:7, zone:"Zone 4-5", notes:"8 reps is a real stimulus — nail the pace, don't exceed it." }
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
        { day:"Wed", type:"Tempo", distance:4, duration:45, zone:"Zone 3-4", description:"1 mile warm up at {easy}. 2 miles at {tempo} — comfortably hard, not racing. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile warm up at {easy}. 1 mile at {tempo} (slightly uncomfortable). 1 mile cool down.", duration:35, distance:3, zone:"Zone 3", notes:"'Comfortably hard' means 3-4 words between breaths, not full sentences." },
            intermediate:{ description:"1 mile warm up at {easy}. 2 miles at {tempo} — comfortably hard, not racing. 1 mile cool down.", duration:45, distance:4, zone:"Zone 3-4", notes:"Tempo pace should feel like 7/10 effort — controlled, not desperate." },
            advanced:{ description:"1 mile warm up. 3 miles at {tempo}. 1 mile cool down.", duration:48, distance:5, zone:"Zone 3-4", notes:"3-mile tempo builds the lactate threshold your 5K depends on." }
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
        { day:"Wed", type:"Intervals", distance:7, duration:50, zone:"Zone 4-5", description:"1 mile warm up at {easy}. 8×400m at {interval5K}. 90 sec rest between. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 5×400m at {interval5K} with 2 min walk rest. 1 mile cool down.", duration:42, distance:4.5, zone:"Zone 3-4", notes:"5 reps is enough — quality over quantity at this stage." },
            intermediate:{ description:"1 mile warm up at {easy}. 8×400m at {interval5K}. 90 sec rest between. 1 mile cool down.", duration:50, distance:7, zone:"Zone 4-5", notes:"8 reps — race effort only on the last 2 reps." },
            advanced:{ description:"1 mile warm up. 10×400m at {interval1mi}. 75 sec rest. 1 mile cool down.", duration:55, distance:8, zone:"Zone 4-5", notes:"10 reps at mile pace builds sub-25 speed reserves." }
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
        { day:"Wed", type:"Tempo", distance:5, duration:55, zone:"Zone 3-4", description:"1 mile warm up at {easy}. 3 miles at {tempo}. 1 mile cool down. Sustained effort.",
          skill_variants:{
            novice:{ description:"1 mile warm up at {easy}. 1.5 miles at {tempo}. 1 mile cool down.", duration:40, distance:3.5, zone:"Zone 3", notes:"Longer tempo than week 2 — same effort, slightly more distance." },
            intermediate:{ description:"1 mile warm up at {easy}. 3 miles at {tempo}. 1 mile cool down. Sustained effort — you should be working.", duration:55, distance:5, zone:"Zone 3-4", notes:"3-mile tempo is the bread and butter of sub-25 training." },
            advanced:{ description:"1 mile warm up. 4 miles at {tempo}. 1 mile cool down.", duration:58, distance:6, zone:"Zone 3-4", notes:"4-mile tempo — most demanding session of the program." }
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
        { day:"Wed", type:"Intervals", distance:9, duration:60, zone:"Zone 4", description:"1 mile warm up at {easy}. 6×800m at {interval5K} with 2 min rest. 1 mile cool down. Toughest session of the program.",
          skill_variants:{
            novice:{ description:"1 mile warm up at {easy}. 4×600m at {interval5K} with 2 min rest. 1 mile cool down.", duration:48, distance:5.5, zone:"Zone 3-4", notes:"600m reps at controlled effort — more than you've done before." },
            intermediate:{ description:"1 mile warm up at {easy}. 6×800m at {interval5K} with 2 min rest. 1 mile cool down. Toughest session of the program.", duration:60, distance:9, zone:"Zone 4", notes:"First rep should feel almost too easy. Last rep should be genuinely hard." },
            advanced:{ description:"1 mile warm up. 6×1000m at {interval1mi} with 90 sec rest. 1 mile cool down.", duration:65, distance:10, zone:"Zone 4", notes:"1000m reps simulate race-length efforts — this is where sub-25 is built." }
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
        { day:"Wed", type:"Tempo", distance:4, duration:45, zone:"Zone 3-4", description:"1 mile warm up. 2 miles at {tempo}. 1 mile cool down. Race-preview effort — sharp but controlled.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 1 mile at {tempo}. 1 mile cool down.", duration:35, distance:3, zone:"Zone 3", notes:"Short tempo — remind your legs what effort feels like before race day." },
            intermediate:{ description:"1 mile warm up. 2 miles at {tempo}. 1 mile cool down. Race-preview effort.", duration:45, distance:4, zone:"Zone 3-4", notes:"Should feel controlled, not desperate. You're peaked — trust it." },
            advanced:{ description:"1 mile warm up. 2 miles at {tempo} + 4×400m at {interval5K}. 1 mile cool down.", duration:50, distance:5.5, zone:"Zone 3-5", notes:"Tempo plus speed work confirms race readiness." }
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
        { day:"Mon", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy. Start conservative.",
          skill_variants:{
            novice:{ description:"2.5 miles easy walk/jog. Walk 90 sec every 8 min if needed. 11:00/mile or slower.", duration:32, distance:2.5, zone:"Zone 1-2", notes:"10K training for beginners starts slower than you think is right." },
            intermediate:{ description:"4 miles easy at fully conversational pace. Start conservative.", duration:44, distance:4, zone:"Zone 2", notes:"If breathing hard, slow down — this is an aerobic base day." },
            advanced:{ description:"5 miles easy at 8:30-9:00/mile with 4×20 sec strides at end.", duration:52, distance:5, zone:"Zone 2 with strides", notes:"Strides prime leg turnover without adding meaningful fatigue." }
          }
        },
        { day:"Wed", type:"Intervals", distance:5, duration:45, zone:"Zone 4", description:"1 mile warm up at {easy}. 5×400m at {interval5K} with 90 sec rest. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 4×400m at {interval5K} with 2 min walk rest. 1 mile cool down.", duration:40, distance:3.5, zone:"Zone 2-3", notes:"First interval session — effort is more important than pace right now." },
            intermediate:{ description:"1 mile warm up at {easy}. 5×400m at {interval5K} with 90 sec rest. 1 mile cool down.", duration:45, distance:5, zone:"Zone 4", notes:"Goal pace feels uncomfortable but controlled — 6-7/10 effort." },
            advanced:{ description:"1 mile warm up. 8×400m at {interval1mi} with 75 sec rest. 1 mile cool down.", duration:52, distance:6, zone:"Zone 4-5", notes:"8 reps builds a larger speed reserve for race day." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:3, duration:33, zone:"Zone 2", description:"3 miles easy recovery.",
          skill_variants:{
            novice:{ description:"2 miles very easy. Walk 60 sec if needed.", duration:25, distance:2, zone:"Zone 1-2", notes:"Recovery day — slower than your Monday easy pace." },
            intermediate:{ description:"3 miles easy recovery.", duration:33, distance:3, zone:"Zone 2", notes:"Flush Wednesday's intervals. Zone 2 only." },
            advanced:{ description:"4 miles easy recovery.", duration:44, distance:4, zone:"Zone 2", notes:"More volume recovery supports faster adaptation." }
          }
        },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy. Build 1 mile per week.",
          skill_variants:{
            novice:{ description:"4 miles easy with walk break every 10 min. Fully conversational.", duration:52, distance:4, zone:"Zone 1-2", notes:"Long run builds the aerobic infrastructure the 10K demands." },
            intermediate:{ description:"7 miles easy. Build 1 mile per week.", duration:75, distance:7, zone:"Zone 2", notes:"Conversational means you could hold a phone call the whole way." },
            advanced:{ description:"9 miles easy. Build to 13 miles by peak week.", duration:93, distance:9, zone:"Zone 2", notes:"Higher aerobic ceiling directly raises your 10K ceiling." }
          }
        }
      ]},
      { week:5, theme:"Mid-program push", days:[
        { day:"Mon", type:"Easy Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy.",
          skill_variants:{
            novice:{ description:"4 miles easy continuous — no walk breaks today.", duration:48, distance:4, zone:"Zone 1-2", notes:"Week 5 — your aerobic system is meaningfully stronger than week 1." },
            intermediate:{ description:"6 miles easy.", duration:65, distance:6, zone:"Zone 2", notes:"Mid-program. Keep easy days truly easy." },
            advanced:{ description:"7 miles easy with 6 strides.", duration:72, distance:7, zone:"Zone 2 with strides", notes:"Volume is peaking — strides maintain speed without adding fatigue." }
          }
        },
        { day:"Wed", type:"Tempo", distance:6, duration:65, zone:"Zone 3-4", description:"1 mile warm up at {easy}. 4 miles at {tempo}. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 2 miles at {tempo}. 1 mile cool down.", duration:48, distance:4, zone:"Zone 3", notes:"'Comfortably hard' — you can speak 3-4 words but not a full sentence." },
            intermediate:{ description:"1 mile warm up at {easy}. 4 miles at {tempo}. 1 mile cool down.", duration:65, distance:6, zone:"Zone 3-4", notes:"4-mile tempo is the hardest sustained session of the program." },
            advanced:{ description:"1 mile warm up. 5 miles at {tempo}. 1 mile cool down.", duration:70, distance:7, zone:"Zone 3-4", notes:"5-mile tempo — this is where sub-50 10K fitness is built." }
          }
        },
        { day:"Fri", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy.",
          skill_variants:{
            novice:{ description:"3 miles easy.", duration:36, distance:3, zone:"Zone 1-2", notes:"Post-tempo recovery — go slower than Monday's easy pace." },
            intermediate:{ description:"4 miles easy.", duration:44, distance:4, zone:"Zone 2", notes:"Flush Wednesday's tempo. Nothing heroic." },
            advanced:{ description:"5 miles easy.", duration:52, distance:5, zone:"Zone 2", notes:"Recovery volume supports adaptation." }
          }
        },
        { day:"Sat", type:"Long Run", distance:11, duration:120, zone:"Zone 2", description:"11 miles easy. Getting comfortable at distance.",
          skill_variants:{
            novice:{ description:"7 miles easy with walk breaks every 12 min.", duration:88, distance:7, zone:"Zone 1-2", notes:"7 miles is a real achievement — the walk breaks are part of the training." },
            intermediate:{ description:"11 miles easy. Getting comfortable at distance.", duration:120, distance:11, zone:"Zone 2", notes:"Long run is nearly twice the race distance — the 10K will feel manageable." },
            advanced:{ description:"14 miles easy.", duration:140, distance:14, zone:"Zone 2", notes:"Peak long run coming in 2 weeks — this is the build." }
          }
        }
      ]},
      { week:10, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy. Taper — you're ready.",
          skill_variants:{
            novice:{ description:"2.5 miles easy. Race week — trust your training.", duration:30, distance:2.5, zone:"Zone 1-2", notes:"Fitness is locked in. Just stay loose." },
            intermediate:{ description:"4 miles easy. Taper — you're ready.", duration:44, distance:4, zone:"Zone 2", notes:"Fresh legs are more valuable than one more workout." },
            advanced:{ description:"5 miles easy with 4 strides.", duration:52, distance:5, zone:"Zone 2 with strides", notes:"Strides on race Monday keep legs sharp through the taper." }
          }
        },
        { day:"Wed", type:"Shakeout", distance:3, duration:33, zone:"Zone 2", description:"3 miles with 4 strides. Sharp and fresh.",
          skill_variants:{
            novice:{ description:"2 miles very easy jog. Done.", duration:24, distance:2, zone:"Zone 1-2", notes:"Short and easy. Race is tomorrow. Drink water and sleep well." },
            intermediate:{ description:"3 miles with 4 strides. Sharp and fresh.", duration:33, distance:3, zone:"Zone 2 with strides", notes:"Strides on race eve activate fast-twitch fibers." },
            advanced:{ description:"3 miles easy with 6 strides.", duration:33, distance:3, zone:"Zone 2 with strides", notes:"Final shakeout. Legs should feel electric." }
          }
        },
        { day:"Fri", type:"Rest", duration:0, description:"Complete rest.",
          skill_variants:{
            novice:{ description:"Complete rest. Eat carbs. Hydrate. Sleep 8 hours.", duration:0, distance:0, zone:"Rest", notes:"Nothing today makes you fitter. Just protect tomorrow." },
            intermediate:{ description:"Complete rest. Eat well. Drink water. Sleep 8+ hours.", duration:0, distance:0, zone:"Rest", notes:"Carb-focused dinner tonight. Gear laid out. Bed by 10pm." },
            advanced:{ description:"Complete rest. Carb load. Hydrate aggressively. 8 hours sleep.", duration:0, distance:0, zone:"Rest", notes:"60-80g carbs at dinner. Everything is ready — just sleep." }
          }
        },
        { day:"Sat", type:"RACE DAY", duration:65, description:"10K race. First 2km conservative. Middle 4km at goal pace. Last 4km — give everything.",
          skill_variants:{
            novice:{ description:"10K race. Goal: finish strong. First 3km very easy. Middle 4km at effort. Last 3km — whatever you have.", duration:75, distance:10, zone:"Zone 3-4", notes:"You did the work. Cross the finish line." },
            intermediate:{ description:"10K race. First 2km conservative. Middle 4km at goal pace. Last 4km — give everything.", duration:65, distance:10, zone:"Zone 4-5", notes:"Patience in the first 2km is the entire race plan." },
            advanced:{ description:"10K race. Target sub-50. First km at 8:15/mile. km 2-8 at 7:55/mile. Last 2km empty the tank.", duration:50, distance:10, zone:"Zone 4-5", notes:"Negative splits — the second half faster than the first." }
          }
        }
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
        { day:"Mon", type:"Easy Run", distance:4, duration:45, zone:"Zone 2", description:"4 miles easy. Build your aerobic base.",
          skill_variants:{
            novice:{ description:"3 miles easy. Walk 90 sec every 8 min if needed. Very conversational.", duration:38, distance:3, zone:"Zone 1-2", notes:"Half marathon training starts with walking breaks — that's correct and normal." },
            intermediate:{ description:"4 miles easy. Build your aerobic base.", duration:45, distance:4, zone:"Zone 2", notes:"Aerobic base is the foundation everything else builds on." },
            advanced:{ description:"5 miles easy at 8:30-9:00/mile with 4 strides at end.", duration:55, distance:5, zone:"Zone 2 with strides", notes:"Strides keep leg speed sharp through the base-building phase." }
          }
        },
        { day:"Wed", type:"Tempo", distance:5, duration:55, zone:"Zone 3", description:"1 mile warm up. 3 miles at comfortably hard pace. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile easy warm up. 1.5 miles at slightly uncomfortable pace. 1 mile easy cool down.", duration:40, distance:3.5, zone:"Zone 2-3", notes:"First tempo session — effort over pace. 6/10 effort, not racing." },
            intermediate:{ description:"1 mile warm up. 3 miles at comfortably hard pace. 1 mile cool down.", duration:55, distance:5, zone:"Zone 3", notes:"Comfortably hard means 7/10 effort — sustained but not desperate." },
            advanced:{ description:"1 mile warm up. 4 miles at 8:30/mile. 1 mile cool down.", duration:60, distance:6, zone:"Zone 3-4", notes:"4-mile tempo builds the lactate threshold the half marathon demands." }
          }
        },
        { day:"Thu", type:"Easy Run", distance:3, duration:33, zone:"Zone 2", description:"3 miles easy recovery.",
          skill_variants:{
            novice:{ description:"2 miles very easy. Walk 60 sec if needed.", duration:26, distance:2, zone:"Zone 1-2", notes:"Recovery run — slower than Monday's easy pace." },
            intermediate:{ description:"3 miles easy recovery.", duration:33, distance:3, zone:"Zone 2", notes:"Flush Wednesday's tempo. Zone 2 only." },
            advanced:{ description:"4 miles easy recovery.", duration:44, distance:4, zone:"Zone 2", notes:"Active recovery accelerates adaptation." }
          }
        },
        { day:"Sat", type:"Long Run", distance:8, duration:90, zone:"Zone 2", description:"8 miles easy. This builds to 11 miles at peak.",
          skill_variants:{
            novice:{ description:"5 miles easy with walk break every 10 min. Conversational the whole way.", duration:65, distance:5, zone:"Zone 1-2", notes:"Long run pace should be so easy it almost feels like cheating." },
            intermediate:{ description:"8 miles easy. This builds to 11 miles at peak.", duration:90, distance:8, zone:"Zone 2", notes:"Conversational pace — you're building the engine, not racing." },
            advanced:{ description:"10 miles easy. Build to 14 miles by peak.", duration:105, distance:10, zone:"Zone 2", notes:"Higher long run peak means more aerobic ceiling on race day." }
          }
        }
      ]},
      { week:8, theme:"Peak training", days:[
        { day:"Mon", type:"Easy Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy.",
          skill_variants:{
            novice:{ description:"4 miles easy continuous. No walk breaks at this point.", duration:50, distance:4, zone:"Zone 1-2", notes:"8 weeks in — your aerobic system is genuinely strong now." },
            intermediate:{ description:"6 miles easy.", duration:65, distance:6, zone:"Zone 2", notes:"Peak training week. Keep easy days easy — save it for Wednesday." },
            advanced:{ description:"7 miles easy with 6 strides.", duration:72, distance:7, zone:"Zone 2 with strides", notes:"Strides during peak week maintain speed while volume peaks." }
          }
        },
        { day:"Wed", type:"Tempo", distance:8, duration:85, zone:"Zone 3", description:"1 mile warm up. 6 miles at goal half marathon pace. 1 mile cool down.",
          skill_variants:{
            novice:{ description:"1 mile warm up. 3 miles at 10:30/mile (comfortably hard). 1 mile cool down.", duration:60, distance:5, zone:"Zone 3", notes:"3-mile tempo at week 8 is the hardest session of your program." },
            intermediate:{ description:"1 mile warm up. 6 miles at goal half marathon pace. 1 mile cool down.", duration:85, distance:8, zone:"Zone 3", notes:"6-mile tempo at race pace is the peak training stimulus. Respect it." },
            advanced:{ description:"1 mile warm up. 7 miles at 9:00/mile. 1 mile cool down.", duration:90, distance:9, zone:"Zone 3-4", notes:"7-mile tempo at faster pace — the highest training load of the program." }
          }
        },
        { day:"Thu", type:"Easy Run", distance:5, duration:55, zone:"Zone 2", description:"5 miles easy.",
          skill_variants:{
            novice:{ description:"3 miles easy.", duration:38, distance:3, zone:"Zone 1-2", notes:"Recovery from peak tempo. Go slow." },
            intermediate:{ description:"5 miles easy.", duration:55, distance:5, zone:"Zone 2", notes:"Easy recovery after the hardest session of the program." },
            advanced:{ description:"6 miles easy.", duration:65, distance:6, zone:"Zone 2", notes:"Flush the long tempo. Zone 2 strictly." }
          }
        },
        { day:"Sat", type:"Long Run", distance:11, duration:125, zone:"Zone 2", description:"11 miles easy. Peak long run. Fuel practice — take a gel at mile 5.",
          skill_variants:{
            novice:{ description:"8 miles easy with walk breaks every 12 min. Take water at mile 4.", duration:100, distance:8, zone:"Zone 1-2", notes:"8 miles is your peak long run — practice drinking while moving." },
            intermediate:{ description:"11 miles easy. Peak long run. Fuel practice — take a gel at mile 5.", duration:125, distance:11, zone:"Zone 2", notes:"Fueling practice is mandatory — your gut needs training too." },
            advanced:{ description:"14 miles easy. Gel at mile 5 and mile 10. Final 2 miles at race pace.", duration:148, distance:14, zone:"Zone 2 to Zone 3", notes:"14-mile peak with race-pace finish is the most complete training stimulus." }
          }
        }
      ]},
      { week:16, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:45, zone:"Zone 2", description:"4 miles easy taper.",
          skill_variants:{
            novice:{ description:"2.5 miles easy. Race week — you're ready.", duration:30, distance:2.5, zone:"Zone 1-2", notes:"16 weeks of work is done. Just stay loose." },
            intermediate:{ description:"4 miles easy taper.", duration:45, distance:4, zone:"Zone 2", notes:"Taper restlessness is normal. Trust the training." },
            advanced:{ description:"5 miles easy with 4 strides.", duration:52, distance:5, zone:"Zone 2 with strides", notes:"Race-week strides maintain sharpness through the taper." }
          }
        },
        { day:"Wed", type:"Shakeout", distance:3, duration:33, zone:"Zone 2", description:"3 miles with strides.",
          skill_variants:{
            novice:{ description:"2 miles very easy jog. Done.", duration:26, distance:2, zone:"Zone 1-2", notes:"Short and easy. Race is in 3 days. Sleep and hydrate." },
            intermediate:{ description:"3 miles with strides.", duration:33, distance:3, zone:"Zone 2 with strides", notes:"Strides on race eve prime the legs without adding fatigue." },
            advanced:{ description:"3 miles easy with 6 strides.", duration:33, distance:3, zone:"Zone 2 with strides", notes:"Final shakeout. Legs should feel electric." }
          }
        },
        { day:"Thu", type:"Rest", duration:0, description:"Rest. Carb load. Hydrate.",
          skill_variants:{
            novice:{ description:"Full rest. Eat carbs. Drink water. Sleep 8 hours.", duration:0, distance:0, zone:"Rest", notes:"You cannot get fitter today. Protect tomorrow." },
            intermediate:{ description:"Rest. Carb load. Hydrate.", duration:0, distance:0, zone:"Rest", notes:"8g carbs per kg bodyweight today. 500ml water every 2 hours." },
            advanced:{ description:"Full rest. Aggressive carb load — 8-10g/kg bodyweight. Hydrate all day.", duration:0, distance:0, zone:"Rest", notes:"Carb load is real and matters for a half marathon. Don't skip it." }
          }
        },
        { day:"Sat", type:"RACE DAY", duration:130, description:"Half Marathon. Miles 1-3: slower than goal pace. Miles 4-10: goal pace. Miles 11-13.1: empty the tank.",
          skill_variants:{
            novice:{ description:"Half Marathon. First 5 miles: very easy — hold back even if you feel great. Miles 6-10: goal pace. Last 3.1: give what you have.", duration:150, distance:21.1, zone:"Zone 2-4", notes:"The race is won or lost in the first 5 miles. Go out easy." },
            intermediate:{ description:"Half Marathon. Miles 1-3: slower than goal pace. Miles 4-10: goal pace. Miles 11-13.1: empty the tank.", duration:130, distance:21.1, zone:"Zone 3-5", notes:"Gel at mile 4 and mile 8. Patience in the first 3 miles is everything." },
            advanced:{ description:"Half Marathon sub-1:55. Miles 1-3: 9:00/mile. Miles 4-10: 8:45/mile. Last 3.1: whatever you have.", duration:115, distance:21.1, zone:"Zone 4-5", notes:"Race the second half. The fitness is there — trust it." }
          }
        }
      ]}
    ]
  },

  // ─── ADVANCED MARATHON PREP ──────────────────────────────────────────────────
  "Advanced Marathon Prep": {
    weeks: 16,
    goal: "Qualify for Boston or set a new PR — sub-3:30 marathon performance",
    structure: "5 run days + 1 strength + 1 rest. Periodized mileage: 3-week progressive / 1-week recovery cycles.",
    keyWeeks: {
      1:  { mileage: 45, theme: "Base",              keyWorkouts: ["8km easy", "12km with 6km @tempo", "20km long run easy"] },
      4:  { mileage: 40, theme: "Recovery week",     keyWorkouts: ["Easy running only. No tempo, no intervals."] },
      8:  { mileage: 60, theme: "Peak volume",       keyWorkouts: ["16×800m @ 5K pace", "10km @marathon pace", "35km long run"] },
      12: { mileage: 55, theme: "Race simulation",   keyWorkouts: ["32km long run with last 8km @race pace"] },
      16: { mileage: 25, theme: "Taper",             keyWorkouts: ["4km easy", "2km race pace", "RACE DAY"] }
    }
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
        { day:"Mon", type:"Strength", duration:60, description:"Squat 4×8, Deadlift 4×6, Overhead Press 3×10, Pull Up 3×8, Farmers Carry 3×40m. Build the engine.",
          skill_variants:{
            novice:{ description:"Goblet Squat 3×10, Deadlift 3×8 (light), DB Press 3×12, Band Pull 3×15, Farmers Carry 2×30m. Learn the movements first.", duration:50, sled_weight:"Bodyweight only", wall_balls:"10 reps light ball", rest_between_stations:"4 min", goal:"Learn every movement with perfect form.", modifications:["Use dumbbells not barbells","Reduce range of motion if mobility limited","Skip farmers carry if grip gives out"] },
            intermediate:{ description:"Squat 4×8, Deadlift 4×6, Overhead Press 3×10, Pull Up 3×8, Farmers Carry 3×40m. Build the engine.", duration:60, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes." },
            advanced:{ description:"Squat 5×5, Deadlift 5×4, Overhead Press 4×8, Pull Up 4×8, Farmers Carry 4×50m. Heavier from week 1.", duration:70, sled_weight:"Competition weight — technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Sub-60 minutes.", additions:["Add 20 min conditioning finisher","Track baseline metrics this week","Double session days begin week 6"] }
          }
        },
        { day:"Tue", type:"Run", distance:5, duration:30, description:"5km easy run. Establish baseline. Note your pace — you'll race this at week 12.",
          skill_variants:{
            novice:{ description:"3km walk/jog. Walk 2 min, jog 1 min — repeat for 20 min. Cool down walk 5 min. Note how it feels.", duration:28, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Learn your aerobic baseline. No pace targets.", modifications:["Walk the 1km runs in race","All running is optional jogging"] },
            intermediate:{ description:"5km easy run. Establish baseline. Note your pace — you'll race this at week 12.", duration:30, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Note your baseline 5km pace for progress tracking." },
            advanced:{ description:"6km run with middle 2km at Hyrox race pace. Note splits.", duration:38, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Establish race pace benchmark from day 1.", additions:["Track 1km split times","Compare to week 12 result"] }
          }
        },
        { day:"Wed", type:"Station Work", duration:60, description:"SkiErg 4×250m with 2 min rest. Row 4×250m with 2 min rest. TECHNIQUE only — go slow and learn the machines.",
          skill_variants:{
            novice:{ description:"SkiErg 3×150m with 3 min rest. Row 3×150m with 3 min rest. Watch technique videos first. Go at 50% effort.", duration:45, sled_weight:"Bodyweight only", wall_balls:"10 reps", rest_between_stations:"3-4 min", goal:"Learn the machines. Finish is the only goal.", modifications:["Half distances on all stations","Walk the 1km runs","Skip burpee broad jumps — substitute regular burpees"] },
            intermediate:{ description:"SkiErg 4×250m with 2 min rest. Row 4×250m with 2 min rest. TECHNIQUE only — go slow and learn the machines.", duration:60, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Learn technique on every machine." },
            advanced:{ description:"SkiErg 5×250m with 90 sec rest. Row 5×250m with 90 sec rest. Note 250m split times.", duration:65, sled_weight:"Competition weight — technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Establish machine split benchmarks.", additions:["Record 250m SkiErg and Row splits","Compare weekly for progress"] }
          }
        },
        { day:"Thu", type:"Rest", description:"Complete rest or 20 min walk.",
          skill_variants:{
            novice:{ description:"Complete rest. 10 min gentle walk if legs feel tight. Stretch calves and hip flexors.", duration:10, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Recover fully. Three sessions this week is a real load for a beginner.", modifications:["Prioritize sleep over active recovery"] },
            intermediate:{ description:"Complete rest or 20 min walk.", duration:20, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery. This week is about learning, not grinding." },
            advanced:{ description:"20 min easy walk + 15 min mobility and foam rolling. Non-negotiable.", duration:35, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Active recovery maximizes adaptation from high-volume training.", additions:["Hip flexor and thoracic spine mobility focus"] }
          }
        },
        { day:"Fri", type:"Strength", duration:60, description:"Farmers Carry 4×50m heavy, Sled Push 4×20m, Sandbag Lunge 3×20m, Wall Ball 3×20, Burpee Broad Jump 3×10m.",
          skill_variants:{
            novice:{ description:"Farmers Carry 2×30m (light), Sled Push 2×10m (empty sled), Sandbag Lunge 2×10m (light bag), Wall Ball 2×10, Burpee (no jump) 2×8.", duration:45, sled_weight:"Empty sled — bodyweight only", wall_balls:"10 reps light ball", rest_between_stations:"3-4 min", goal:"Learn every station movement safely.", modifications:["Half distances on all stations","Regular burpees instead of broad jumps","Lightest sandbag available"] },
            intermediate:{ description:"Farmers Carry 4×50m heavy, Sled Push 4×20m, Sandbag Lunge 3×20m, Wall Ball 3×20, Burpee Broad Jump 3×10m.", duration:60, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Build station-specific strength and conditioning." },
            advanced:{ description:"Farmers Carry 5×50m max weight, Sled Push 5×25m competition weight, Sandbag Lunge 4×25m, Wall Ball 4×25, Burpee Broad Jump 4×15m.", duration:70, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Station-specific peak conditioning.", additions:["Station weakness identification this week","Note which stations need most work"] }
          }
        },
        { day:"Sat", type:"Long Run", distance:8, duration:50, description:"8km easy — conversational pace the whole way. This builds to 12km at peak.",
          skill_variants:{
            novice:{ description:"4km easy walk/jog. Walk 2 min every 8 min of jogging. Conversational the whole way.", duration:40, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Build aerobic base — Hyrox is 60% running.", modifications:["Walk the 1km runs in race","No pace targets this week"] },
            intermediate:{ description:"8km easy — conversational pace the whole way. This builds to 12km at peak.", duration:50, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic base development. Conversational pace only." },
            advanced:{ description:"10km easy with final 2km at race pace.", duration:62, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic base plus race-pace conditioning.", additions:["Note race pace km splits","Build to 14km by week 8"] }
          }
        },
        { day:"Sun", type:"Rest", description:"Full rest.",
          skill_variants:{
            novice:{ description:"Full rest. 5 sessions this week is enough. Sleep 8+ hours.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery.", modifications:["Prioritize sleep above all else"] },
            intermediate:{ description:"Full rest.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery. This is where adaptation happens." },
            advanced:{ description:"Full rest. Sleep is training. 8-9 hours target.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery at high training volume.", additions:["Track sleep quality — it directly affects station performance"] }
          }
        }
      ]},
      { week:4, focus:"Increasing Intensity", days:[
        { day:"Mon", type:"Strength", duration:65, description:"Squat 5×5, Deadlift 3×4, Overhead Press 4×6, Pull Up 4×6, Farmers Carry 4×50m. Getting heavier.",
          skill_variants:{
            novice:{ description:"Goblet Squat 3×10, Deadlift 3×8 (moderate), DB Press 3×10, Band Pull 3×15, Farmers Carry 3×40m. Adding load from week 1.", duration:50, sled_weight:"Light plates — 25% competition weight", wall_balls:"15 reps", rest_between_stations:"3 min", goal:"Build baseline strength safely.", modifications:["Increase weight only when form is perfect","Substitute ring rows for pull ups if needed"] },
            intermediate:{ description:"Squat 5×5, Deadlift 3×4, Overhead Press 4×6, Pull Up 4×6, Farmers Carry 4×50m. Getting heavier.", duration:65, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes." },
            advanced:{ description:"Squat 6×4 (85% 1RM), Deadlift 4×3 (heavy), Press 5×5, Pull Up 5×5 weighted, Farmers Carry 5×50m.", duration:75, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Sub-60 minutes.", additions:["Progressive overload every session","Track all working weights"] }
          }
        },
        { day:"Tue", type:"Run Intervals", distance:8, duration:55, description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. Exactly simulates Hyrox run segments.",
          skill_variants:{
            novice:{ description:"1km warm up jog/walk. 4×500m at easy jog pace with 2 min walk rest. 1km cool down walk.", duration:40, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Learn to run between efforts — core Hyrox skill.", modifications:["Walk the 1km runs in race","Jog at conversational pace only"] },
            intermediate:{ description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. Exactly simulates Hyrox run segments.", duration:55, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Build the repeated 1km effort capacity Hyrox demands." },
            advanced:{ description:"1km warm up. 8×1km at 5K pace with 60 sec rest. 1km cool down. Race-specific endurance.", duration:65, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"8 reps at race pace builds sub-60 running capacity.", additions:["Track each 1km split","Last 2 reps should feel like race effort"] }
          }
        },
        { day:"Wed", type:"Station Circuit", duration:60, description:"SkiErg 750m, rest 3 min, Row 750m, rest 3 min, Wall Ball 3×25, rest 2 min, Burpee Broad Jump 40m. Building station capacity.",
          skill_variants:{
            novice:{ description:"SkiErg 400m, rest 4 min, Row 400m, rest 4 min, Wall Ball 2×10, rest 3 min, Burpee (no jump) 20m.", duration:45, sled_weight:"Bodyweight only", wall_balls:"10 reps light ball", rest_between_stations:"3-4 min", goal:"Learn the movements. Finish is the only goal.", modifications:["Half distances on all stations","Walk the 1km runs","Regular burpees instead of broad jumps"] },
            intermediate:{ description:"SkiErg 750m, rest 3 min, Row 750m, rest 3 min, Wall Ball 3×25, rest 2 min, Burpee Broad Jump 40m. Building station capacity.", duration:60, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes." },
            advanced:{ description:"SkiErg 1000m, rest 2 min, Row 1000m, rest 2 min, Wall Ball 3×30 unbroken goal, rest 90 sec, Burpee Broad Jump 60m.", duration:70, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Sub-60 minutes.", additions:["Note station times — compare weekly","Identify weakest station for extra work"] }
          }
        },
        { day:"Thu", type:"Recovery", description:"20 min easy walk, mobility work, foam rolling. Non-negotiable recovery.",
          skill_variants:{
            novice:{ description:"15 min gentle walk. Stretch hips, calves, shoulders. Ice anything that aches.", duration:20, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery — week 4 is harder than week 1.", modifications:["Skip if too sore — extra rest beats active recovery when fatigued"] },
            intermediate:{ description:"20 min easy walk, mobility work, foam rolling. Non-negotiable recovery.", duration:25, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Recovery is part of training. Don't skip it." },
            advanced:{ description:"30 min recovery: 15 min walk + foam roll legs and upper back + hip mobility.", duration:35, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Optimize recovery to support double-session weeks ahead.", additions:["Cold exposure if available — speeds station recovery"] }
          }
        },
        { day:"Fri", type:"Strength", duration:60, description:"Sled Push 6×20m, Sled Pull 4×20m, Sandbag Lunge 4×25m, Farmers Carry 4×50m.",
          skill_variants:{
            novice:{ description:"Sled Push 3×10m (empty), Sled Pull 3×10m, Sandbag Lunge 3×15m (light), Farmers Carry 3×40m (light).", duration:45, sled_weight:"Empty sled — bodyweight only", wall_balls:"N/A", rest_between_stations:"3-4 min", goal:"Build station-specific movement patterns.", modifications:["Empty sled only until form is solid","Lightest sandbag available"] },
            intermediate:{ description:"Sled Push 6×20m, Sled Pull 4×20m, Sandbag Lunge 4×25m, Farmers Carry 4×50m.", duration:60, sled_weight:"Competition weight", wall_balls:"N/A", rest_between_stations:"90 sec", goal:"Station-specific conditioning with competition loads." },
            advanced:{ description:"Sled Push 8×20m competition weight, Sled Pull 5×20m, Sandbag Lunge 5×25m, Farmers Carry 5×50m heavy.", duration:70, sled_weight:"Competition weight plus technique focus", wall_balls:"N/A", rest_between_stations:"Minimal — race simulation", goal:"Peak station conditioning.", additions:["Sled push without rest between sets for race simulation"] }
          }
        },
        { day:"Sat", type:"Long Run", distance:10, duration:65, description:"10km easy. Aerobic base matters more than people think for Hyrox.",
          skill_variants:{
            novice:{ description:"6km easy walk/jog. Walk every 10 min for 90 sec.", duration:55, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic base — 60% of Hyrox is running.", modifications:["Walk the 1km runs in race","No pace target"] },
            intermediate:{ description:"10km easy. Aerobic base matters more than people think for Hyrox.", duration:65, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic base development." },
            advanced:{ description:"12km easy with last 2km at race pace.", duration:75, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic base plus race-pace conditioning.", additions:["Build to 14km by week 8"] }
          }
        },
        { day:"Sun", type:"Rest", description:"Full rest.",
          skill_variants:{
            novice:{ description:"Full rest. Week 4 is meaningfully harder than week 1. Sleep 8+ hours.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery.", modifications:["Extra sleep beats extra training every time"] },
            intermediate:{ description:"Full rest.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery." },
            advanced:{ description:"Full rest. 8-9 hours sleep is mandatory at this training volume.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery.", additions:["Sleep quality directly affects station performance"] }
          }
        }
      ]},
      { week:8, focus:"Race Simulation", days:[
        { day:"Mon", type:"Strength", duration:65, description:"Heavy compounds peak week — Squat 5×3, Deadlift 3×3, Press 4×4. Strength should be peaking.",
          skill_variants:{
            novice:{ description:"Squat 3×8 (moderate), Deadlift 3×6, Press 3×10, Pull Up 3×6. Strength is building — still learning.", duration:55, sled_weight:"25-50% competition weight", wall_balls:"15 reps", rest_between_stations:"3 min", goal:"Consistent strength progress — same weight as last week plus 5%.", modifications:["Do not max out — leave 2 reps in reserve"] },
            intermediate:{ description:"Heavy compounds peak week — Squat 5×3, Deadlift 3×3, Press 4×4. Strength should be peaking.", duration:65, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes." },
            advanced:{ description:"Squat 5×2 (90% 1RM), Deadlift 3×2 (heavy), Press 4×3. Strength peaks this week.", duration:70, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Sub-60 minutes.", additions:["This is peak strength week — heaviest lifts of the program","Deload begins week 11"] }
          }
        },
        { day:"Tue", type:"Run", distance:8, duration:50, description:"8km with middle 4km at race pace.",
          skill_variants:{
            novice:{ description:"5km easy run with middle 2km at slightly faster than easy pace.", duration:40, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Build running confidence at controlled effort.", modifications:["Walk the 1km runs in race simulation"] },
            intermediate:{ description:"8km with middle 4km at race pace.", duration:50, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race pace rehearsal — confirm your target time is realistic." },
            advanced:{ description:"8km: 2km easy, 4km at race pace, 2km easy. Note race pace splits.", duration:50, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Confirm sub-60 race pace is sustainable.", additions:["Track each km split at race pace"] }
          }
        },
        { day:"Wed", type:"Half Hyrox Simulation", duration:70, description:"Run 1km, SkiErg 500m, Run 1km, Sled Push 25m, Run 1km, Row 500m, Run 1km, Wall Ball 50 reps. RACE EFFORT. This is your test.",
          skill_variants:{
            novice:{ description:"Run 500m, SkiErg 250m, Run 500m, Sled Push 10m (empty), Run 500m, Row 250m, Rest 5 min between stations.", duration:60, sled_weight:"Bodyweight only", wall_balls:"20 reps", rest_between_stations:"3-4 min", goal:"Learn the race format. Finish is the only goal.", modifications:["Half distances on all stations","Walk the runs","Skip burpee broad jumps"] },
            intermediate:{ description:"Run 1km, SkiErg 500m, Run 1km, Sled Push 25m, Run 1km, Row 500m, Run 1km, Wall Ball 50 reps. RACE EFFORT.", duration:70, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes — this predicts race day." },
            advanced:{ description:"Full half simulation at race effort. Time each segment. Run 1km, SkiErg 500m, Run 1km, Sled Push 25m, Run 1km, Row 500m, Run 1km, Wall Ball 50 reps.", duration:60, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Sub-30 min half simulation predicts sub-60 full race.", additions:["Record split times for each station and run","Identify pacing errors for race day"] }
          }
        },
        { day:"Thu", type:"Recovery", description:"Full recovery — this is mandatory after the simulation.",
          skill_variants:{
            novice:{ description:"Full rest. Walk 10 min if legs are very stiff. The simulation was a big effort.", duration:10, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery after biggest training day so far.", modifications:["Extra sleep beats any form of active recovery today"] },
            intermediate:{ description:"Full recovery — this is mandatory after the simulation.", duration:20, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Mandatory recovery after race simulation." },
            advanced:{ description:"Full recovery. 20 min walk, foam roll, cold shower if available.", duration:30, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Optimize recovery to support Friday's station work.", additions:["Cold exposure reduces inflammation after race simulation efforts"] }
          }
        },
        { day:"Fri", type:"Station Repeats", duration:55, description:"Farmers Carry 6×50m, Sandbag Lunge 4×25m, Burpee Broad Jump 4×20m. Weakness work.",
          skill_variants:{
            novice:{ description:"Farmers Carry 3×30m, Sandbag Lunge 3×15m (light), Burpee (no jump) 3×10m. Focus on weakest station.", duration:40, sled_weight:"Light", wall_balls:"N/A", rest_between_stations:"3-4 min", goal:"Practice your weakest station movements.", modifications:["Identify weakest station from Wednesday simulation","Focus extra time there"] },
            intermediate:{ description:"Farmers Carry 6×50m, Sandbag Lunge 4×25m, Burpee Broad Jump 4×20m. Weakness work.", duration:55, sled_weight:"Competition weight", wall_balls:"N/A", rest_between_stations:"90 sec", goal:"Station weakness elimination." },
            advanced:{ description:"Farmers Carry 8×50m, Sandbag Lunge 5×25m, Burpee Broad Jump 5×20m. Maximum station volume.", duration:65, sled_weight:"Competition weight plus technique focus", wall_balls:"N/A", rest_between_stations:"Minimal — race simulation", goal:"Peak station-specific conditioning.", additions:["Double up on identified weakness station","Pacing strategy by station — map this out"] }
          }
        },
        { day:"Sat", type:"Long Run", distance:12, duration:75, description:"12km easy. Peak long run.",
          skill_variants:{
            novice:{ description:"7km easy walk/jog. Walk 90 sec every 10 min of running.", duration:65, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic base peak — Hyrox is 60% running.", modifications:["Walk the 1km runs in race"] },
            intermediate:{ description:"12km easy. Peak long run.", duration:75, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Peak aerobic base." },
            advanced:{ description:"14km easy. Peak long run — builds aerobic engine for sub-60.", duration:88, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Aerobic ceiling supports sub-60 minute race.", additions:["This is the highest long run of the program"] }
          }
        },
        { day:"Sun", type:"Rest", description:"Full rest.",
          skill_variants:{
            novice:{ description:"Full rest. Week 8 was the hardest week of the program so far.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery.", modifications:["Sleep 9 hours if possible"] },
            intermediate:{ description:"Full rest.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery." },
            advanced:{ description:"Full rest. 9 hours sleep. This is peak week.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery at peak training volume.", additions:["Nutrition: protein 2.2g/kg, carbs elevated post-workout"] }
          }
        }
      ]},
      { week:10, focus:"Full Race Simulation", days:[
        { day:"Mon", type:"Strength", duration:55, description:"Moderate strength — maintain, don't build. Last heavy week.",
          skill_variants:{
            novice:{ description:"Squat 3×8, Deadlift 3×6, Press 3×10. Moderate weight — maintain what you've built.", duration:45, sled_weight:"50% competition weight", wall_balls:"15 reps", rest_between_stations:"3 min", goal:"Maintain strength heading into race simulation week.", modifications:["Keep weights the same as last week — no increases"] },
            intermediate:{ description:"Moderate strength — maintain, don't build. Last heavy week.", duration:55, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Maintain strength — taper begins next week." },
            advanced:{ description:"Strength maintenance: Squat 4×3, Deadlift 3×3, Press 4×3. Heavy but not max.", duration:60, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Maintain peak strength into final race simulation.", additions:["This is the last strength session before race week"] }
          }
        },
        { day:"Tue", type:"Run Intervals", distance:7, duration:50, description:"4×1km at race pace. Sharpening.",
          skill_variants:{
            novice:{ description:"4×500m at easy jog pace with 2 min walk rest. Race simulation prep.", duration:35, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Run confidence before Wednesday's simulation.", modifications:["Walk the 1km runs in simulation tomorrow"] },
            intermediate:{ description:"4×1km at race pace. Sharpening.", duration:50, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race-sharp legs before full simulation." },
            advanced:{ description:"6×1km at race pace with 60 sec rest. Final speed work before race.", duration:60, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race-sharp legs confirm sub-60 readiness.", additions:["All 6 reps at race pace — no excuses"] }
          }
        },
        { day:"Wed", type:"FULL HYROX SIMULATION", duration:90, description:"Complete race simulation. All 8 stations with 1km runs between each. Race pace. Note your time — this predicts race day.",
          skill_variants:{
            novice:{ description:"Half Hyrox simulation: 4 stations with 1km runs between. SkiErg 500m, Sled Push 25m, Row 500m, Wall Ball 30 reps. Rest 4 min between stations.", duration:75, sled_weight:"Bodyweight only on sled", wall_balls:"20 reps", rest_between_stations:"3-4 min", goal:"Finish the simulation. Time yourself. Learn the race format.", modifications:["Half distances on all stations","Walk the 1km runs","Skip burpee broad jumps"] },
            intermediate:{ description:"Complete race simulation. All 8 stations with 1km runs between each. Race pace. Note your time — this predicts race day.", duration:90, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes. Your time today predicts race day." },
            advanced:{ description:"Full Hyrox simulation at race pace. All 8 stations. Time each run and station. Target sub-60.", duration:70, sled_weight:"Competition weight plus technique focus", wall_balls:"Unbroken sets goal", rest_between_stations:"Minimal — race simulation", goal:"Sub-60 minute simulation confirms race readiness.", additions:["Record every split — runs and stations","Pacing: conservative first 3 runs, attack stations 5-8"] }
          }
        },
        { day:"Thu", type:"Rest", description:"2 days full rest after simulation.",
          skill_variants:{
            novice:{ description:"Full rest. The simulation was massive. Walk 10 min if desperately stiff.", duration:10, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery from biggest training day of the program.", modifications:["Sleep is the only recovery tool needed today"] },
            intermediate:{ description:"2 days full rest after simulation.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Mandatory recovery after full race simulation." },
            advanced:{ description:"Full rest. Cold shower or ice bath if legs are very sore.", duration:15, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Fast recovery to support Saturday's easy run.", additions:["Protein 2.5g/kg today to support muscle recovery"] }
          }
        },
        { day:"Fri", type:"Rest", description:"Full rest.",
          skill_variants:{
            novice:{ description:"Full rest. Second rest day after simulation. Your body earned it.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery.", modifications:["Do not add any training today"] },
            intermediate:{ description:"Full rest.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery. Two rest days after full simulation is correct." },
            advanced:{ description:"Full rest or 15 min walk. Taper officially begins.", duration:15, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Start the taper. You're already fit.", additions:["Reduce total training stress 30% over the next 10 days"] }
          }
        },
        { day:"Sat", type:"Easy Run", distance:8, duration:50, description:"8km very easy. Flush the legs.",
          skill_variants:{
            novice:{ description:"4km very easy walk/jog. Just flushing the legs.", duration:35, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Active recovery — flush simulation fatigue.", modifications:["Walk if legs are still heavy from Wednesday"] },
            intermediate:{ description:"8km very easy. Flush the legs.", duration:50, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Active recovery — flush simulation fatigue." },
            advanced:{ description:"8km very easy. No strides, no pickups. Flush only.", duration:50, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Active recovery. Race is 2 weeks away.", additions:["Resist the urge to push — taper paranoia is normal"] }
          }
        },
        { day:"Sun", type:"Rest", description:"Full rest.",
          skill_variants:{
            novice:{ description:"Full rest. Reflect on simulation results — what stations need focus?", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery plus mental race preparation.", modifications:["Review simulation video if filmed"] },
            intermediate:{ description:"Full rest.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full recovery." },
            advanced:{ description:"Full rest. Review simulation splits. Plan race strategy.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race strategy locked in for sub-60.", additions:["Pacing plan: assign target time to each station and run segment"] }
          }
        }
      ]},
      { week:12, focus:"Race Week — TAPER", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:25, description:"4km very easy. Just moving.",
          skill_variants:{
            novice:{ description:"2km very easy jog/walk. Just staying loose.", duration:18, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Stay loose. Race is 5 days away.", modifications:["Walk is fine — movement matters, not pace"] },
            intermediate:{ description:"4km very easy. Just moving.", duration:25, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Stay loose. Fitness is locked in." },
            advanced:{ description:"4km very easy with 4 strides. Light and bouncy.", duration:28, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race-week sharpness without fatigue.", additions:["Strides on race Monday are the final speed stimulus"] }
          }
        },
        { day:"Tue", type:"Shakeout Stations", duration:30, description:"1 round of each station at 50% effort. Just feeling the movements.",
          skill_variants:{
            novice:{ description:"2-3 stations at 30% effort — just feeling the movements. SkiErg 100m, Row 100m, Wall Ball 5 reps.", duration:20, sled_weight:"Empty sled", wall_balls:"5 reps only", rest_between_stations:"3-4 min", goal:"Confidence not fitness. You know these movements.", modifications:["Skip any station that feels bad — rest instead"] },
            intermediate:{ description:"1 round of each station at 50% effort. Just feeling the movements.", duration:30, sled_weight:"Competition weight", wall_balls:"10 reps", rest_between_stations:"90 sec", goal:"Muscle memory activation. Race day confidence." },
            advanced:{ description:"1 round of each station at 60% effort. Note which stations feel sharp.", duration:35, sled_weight:"Competition weight plus technique focus", wall_balls:"20 reps unbroken", rest_between_stations:"Minimal", goal:"Confirm race sharpness.", additions:["Any station feeling off — do 1 extra easy set"] }
          }
        },
        { day:"Wed", type:"Rest", description:"Complete rest.",
          skill_variants:{
            novice:{ description:"Complete rest. Eat well. Drink water. Sleep 8 hours.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full rest 3 days before race.", modifications:["No extra training — nothing you do today improves your fitness"] },
            intermediate:{ description:"Complete rest.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full rest. The work is done." },
            advanced:{ description:"Complete rest. Visualize your race pacing strategy.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Mental race preparation.", additions:["Review split targets for each station and run segment"] }
          }
        },
        { day:"Thu", type:"Rest", description:"Complete rest. Eat well. 9 hours sleep.",
          skill_variants:{
            novice:{ description:"Complete rest. Carb load. Drink water all day. Sleep 8+ hours.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Full rest 2 days before race. Fuel tomorrow's performance.", modifications:["Eat more carbs than usual — pasta, rice, bread are correct"] },
            intermediate:{ description:"Complete rest. Eat well. 9 hours sleep.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Carb load and maximize sleep." },
            advanced:{ description:"Complete rest. 8-10g carbs per kg bodyweight. Hydrate aggressively. Gear laid out.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Glycogen supercompensation for sub-60 effort.", additions:["Race belt packed","Station strategy reviewed and memorized"] }
          }
        },
        { day:"Fri", type:"Rest", description:"Full rest. Carb load. Hydrate. Lay out your gear.",
          skill_variants:{
            novice:{ description:"Full rest. Eat normally plus a bit more carbs. Lay out your gear and check the venue.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race eve rest. Everything is ready.", modifications:["Know the venue layout — find parking, bag drop, warm-up area"] },
            intermediate:{ description:"Full rest. Carb load. Hydrate. Lay out your gear.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Race eve. Everything is ready." },
            advanced:{ description:"Full rest. Final carb load. Gear and race belt ready. 80-100g carbs 2 hours before race tomorrow.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Optimal pre-race preparation.", additions:["Pre-race breakfast planned: 80-100g carbs 2h before start"] }
          }
        },
        { day:"Sat", type:"RACE DAY — HYROX", description:"Race day. Pace the first 2 runs conservatively — everyone goes out too fast. Attack the stations with good technique. Leave everything on the floor.",
          skill_variants:{
            novice:{ description:"RACE DAY. Walk/jog the runs. Focus on technique at every station. Rest between stations if needed. Crossing the finish line is everything.", duration:120, sled_weight:"Competition weight (or modified)", wall_balls:"Full reps — take your time", rest_between_stations:"As needed", goal:"Finish the race. That is the only goal.", modifications:["Walk all 1km runs","Take rest breaks at any station","Modified weights are available — use them"] },
            intermediate:{ description:"Race day. Pace the first 2 runs conservatively — everyone goes out too fast. Attack the stations with good technique. Leave everything on the floor.", duration:90, sled_weight:"Competition weight", wall_balls:"75 women / 100 men", rest_between_stations:"90 sec", goal:"Finish under 90 minutes." },
            advanced:{ description:"Race day. Sub-60 target. Conservative first 3 runs. Full attack on stations 5-8. Empty the tank on the last run.", duration:60, sled_weight:"Competition weight — full race effort", wall_balls:"Unbroken sets — no drops", rest_between_stations:"Minimal — race simulation", goal:"Sub-60 minutes.", additions:["Pacing strategy: first 3 runs at 4:45/km, stations at race effort, last 3 runs at 4:30/km"] }
          }
        },
        { day:"Sun", type:"Recovery", description:"You earned it. Eat, sleep, reflect.",
          skill_variants:{
            novice:{ description:"You finished a Hyrox. Eat whatever you want. Sleep as long as you want. Be genuinely proud.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Recovery and celebration.", modifications:["No training for at least 1 week"] },
            intermediate:{ description:"You earned it. Eat, sleep, reflect.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Recovery. You earned it." },
            advanced:{ description:"Recovery. Eat 2.5g protein/kg. Ice if needed. Review splits and plan next race.", duration:0, sled_weight:"N/A", wall_balls:"N/A", rest_between_stations:"N/A", goal:"Recover and set next target.", additions:["Review which stations cost the most time — target for next cycle"] }
          }
        }
      ]}
    ]
  },

  // ─── 8-WEEK FIRST TIMER ──────────────────────────────────────────────────────
  "8-Week First Timer": {
    weeks: 8,
    goal: "Complete your first Hyrox and feel proud crossing the line",
    structure: "2 run sessions + 1 station intro + 1 strength day + 3 rest days",
    weeks_detail: [
      { week: 1, focus: "Station Introduction", days: [
        { day: "Mon", type: "Strength", duration: 50, description: "Squat 3×10, Deadlift 3×8, OHP 3×10, Pull Up 3×max, Farmers Carry 2×30m. Learn the movements.",
          skill_variants: { novice: { description: "Bodyweight squat if needed. All movements with light weight first.", goal: "Learn the patterns.", sled_weight: "Empty", wall_balls: "6kg", rest_between_stations: "3-4 min" } } },
        { day: "Tue", type: "Easy Run", duration: 25, description: "3km easy. Conversational pace. If walking, that's fine.",
          skill_variants: { novice: { description: "Walk/run intervals. Keep moving.", duration: "20-30 min", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A", goal: "Complete 3km of movement." } } },
        { day: "Wed", type: "Station Intro", duration: 40, description: "SkiErg 3×100m technique only. Row 3×100m technique only. Wall Ball 3×10 light. Learn the movements.",
          skill_variants: { novice: { description: "Ask gym staff to show you the SkiErg and rower. Form first, always.", sled_weight: "Empty sled only", wall_balls: "6kg", rest_between_stations: "4 min", goal: "Know how every machine works." } } },
        { day: "Thu", type: "Rest", duration: 0, description: "Active recovery or full rest.", skill_variants: { novice: { description: "Full rest.", goal: "Recover.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Strength", duration: 40, description: "Sled Push 3×15m empty. Sandbag Carry 2×20m. Farmers Carry 3×30m.",
          skill_variants: { novice: { description: "Focus on movement quality. No weight on sled yet.", sled_weight: "Empty", goal: "Learn the station movements.", wall_balls: "N/A", rest_between_stations: "3-4 min" } } },
        { day: "Sat", type: "Long Run", duration: 45, description: "5km easy. The longest run of week 1.",
          skill_variants: { novice: { description: "Walk/run. Goal is 5km of movement.", duration: "40-50 min", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A", goal: "5km total movement." } } },
        { day: "Sun", type: "Rest", duration: 0, description: "Rest.", skill_variants: { novice: { description: "Full rest.", goal: "Recover.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
      ]},
      { week: 4, focus: "Building Volume", days: [
        { day: "Mon", type: "Strength", duration: 55, description: "Squat 4×8, Deadlift 3×6, OHP 3×8, Pull Up 3×max, Farmers Carry 3×40m.",
          skill_variants: { novice: { description: "Add small weight from week 1. Focus on form.", goal: "Add load from week 1.", sled_weight: "10-20kg", wall_balls: "6-9kg", rest_between_stations: "3 min" } } },
        { day: "Tue", type: "Run Intervals", duration: 30, description: "4×500m at effort with 90 sec rest.",
          skill_variants: { novice: { description: "Run at a pace where you can't speak full sentences.", duration: "30 min", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A", goal: "Learn interval effort." } } },
        { day: "Wed", type: "Station Circuit", duration: 50, description: "SkiErg 3×250m, Row 3×250m, Wall Ball 3×15, Sled Push 2×15m light.",
          skill_variants: { novice: { description: "Moderate pace on all stations. Learn the rhythm.", sled_weight: "10-20kg", wall_balls: "6-9kg", rest_between_stations: "2-3 min", goal: "Station confidence." } } },
        { day: "Thu", type: "Rest", duration: 0, description: "Rest.", skill_variants: { novice: { description: "Full rest.", goal: "Recover.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Functional Strength", duration: 50, description: "Sled Push 4×20m, Sled Pull 3×20m, Sandbag Lunge 3×15m, BBJ 3×5m.",
          skill_variants: { novice: { description: "Light loads. Movement quality over weight.", sled_weight: "20-30kg", wall_balls: "N/A", rest_between_stations: "3 min", goal: "Functional strength base." } } },
        { day: "Sat", type: "Long Run", duration: 55, description: "7km easy.",
          skill_variants: { novice: { description: "Walk/jog the 7km. No pace target.", duration: "50-60 min", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A", goal: "Build aerobic base." } } },
        { day: "Sun", type: "Rest", duration: 0, description: "Rest.", skill_variants: { novice: { description: "Full rest.", goal: "Recover.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
      ]},
      { week: 8, focus: "Race Week", days: [
        { day: "Mon", type: "Easy Run", duration: 20, description: "3km very easy. Last real run.",
          skill_variants: { novice: { description: "Just shake the legs out. Easy jog or walk.", goal: "Stay loose.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Tue", type: "Shakeout", duration: 25, description: "1 round each station at 40% effort. Mental rehearsal.",
          skill_variants: { novice: { description: "One easy round of each station. Remember the movements.", sled_weight: "Race weight", wall_balls: "Race weight", rest_between_stations: "3-4 min", goal: "Remember the movements." } } },
        { day: "Wed", type: "Rest", duration: 0, description: "Rest.", skill_variants: { novice: { description: "Full rest.", goal: "Conserve energy.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Thu", type: "Rest", duration: 0, description: "Rest.", skill_variants: { novice: { description: "Full rest. Eat well. Hydrate.", goal: "Carb load and hydrate.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Rest", duration: 0, description: "Rest. Gear ready.", skill_variants: { novice: { description: "Pack your bag. Lay out your gear. Know the venue.", goal: "Race eve prep.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Sat", type: "RACE DAY", duration: 120, description: "Your first Hyrox. Start conservative, finish strong.",
          skill_variants: { novice: { description: "Walk/jog the runs. Focus on technique at every station. Crossing the finish line is everything.", sled_weight: "Competition weight (or modified)", wall_balls: "Full reps — take your time", rest_between_stations: "As needed", goal: "Finish the race. That is the only goal." } } },
        { day: "Sun", type: "Recovery", duration: 0, description: "Walk, eat, celebrate.",
          skill_variants: { novice: { description: "You finished a Hyrox. Eat whatever you want. Be genuinely proud.", goal: "Recovery and celebration.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
      ]}
    ]
  },

  // ─── 16-WEEK ELITE PREP ──────────────────────────────────────────────────────
  "16-Week Elite Prep": {
    weeks: 16,
    goal: "Sub-60 min Open or Pro category — peak Hyrox performance",
    structure: "4 strength days + 3 run/conditioning days per week at peak. Double sessions optional in weeks 8-12.",
    weeks_detail: [
      { week: 1, focus: "Base Assessment", days: [
        { day: "Mon", type: "Strength", duration: 75, description: "Squat 5×5, Deadlift 5×3, OHP 4×5, Weighted Pull Up 4×5, Farmers Carry 5×50m. Establish baseline.",
          skill_variants: { advanced: { description: "This is your baseline. Record every working weight. You'll beat these in week 14.", goal: "Establish baseline strength.", sled_weight: "Competition weight", wall_balls: "Unbroken sets", rest_between_stations: "Minimal" } } },
        { day: "Tue", type: "Run", duration: 40, description: "6km with 2km at Hyrox race pace. Note splits.",
          skill_variants: { advanced: { description: "Establish race pace benchmark from day 1.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A", goal: "Baseline race pace assessment." } } },
        { day: "Wed", type: "Station Work", duration: 70, description: "Full station circuit at race effort. Time every station. SkiErg 1000m, Row 1000m, Wall Ball 100, Sled Push 50m, Farmers 50m.",
          skill_variants: { advanced: { description: "Race effort on every station. Record splits.", sled_weight: "Competition weight", wall_balls: "Unbroken target", rest_between_stations: "Minimal", goal: "Station baseline times." } } },
        { day: "Thu", type: "Recovery", duration: 30, description: "30 min walk + mobility. Non-negotiable at this volume.",
          skill_variants: { advanced: { description: "Cold exposure if available. Thoracic and hip mobility.", goal: "Optimize recovery.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Strength", duration: 75, description: "Power Clean 5×3, Push Press 5×3, Sled Push 6×25m, Sled Pull 5×25m.",
          skill_variants: { advanced: { description: "Explosive focus. Move every rep with intent.", goal: "Power and station strength.", sled_weight: "Competition weight", wall_balls: "N/A", rest_between_stations: "Minimal" } } },
        { day: "Sat", type: "Long Run", duration: 75, description: "12km easy with last 3km at marathon pace.",
          skill_variants: { advanced: { description: "Aerobic base is the foundation of sub-60 Hyrox.", goal: "Aerobic base building.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Sun", type: "Rest", duration: 0, description: "Full rest. 9 hours sleep.",
          skill_variants: { advanced: { description: "Full rest. Sleep is training.", goal: "Full recovery.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
      ]},
      { week: 8, focus: "Peak Volume Block", days: [
        { day: "Mon", type: "Strength AM", duration: 80, description: "Squat 5×2 @ 90%, Deadlift 4×2 heavy, Press 5×3.",
          skill_variants: { advanced: { description: "Heaviest lifts of the program. Leave nothing in the tank.", goal: "Peak strength.", sled_weight: "Competition weight", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Mon", type: "Conditioning PM", duration: 45, description: "OPTIONAL: 20 min station repeats at 70% effort.",
          skill_variants: { advanced: { description: "Double session. Only if recovery supports it.", goal: "Volume accumulation.", sled_weight: "Competition weight", wall_balls: "N/A", rest_between_stations: "90 sec" } } },
        { day: "Tue", type: "Run Intervals", duration: 65, description: "10×1km at race pace with 60 sec rest.",
          skill_variants: { advanced: { description: "10 reps at race pace. This is the hardest running session of the program.", goal: "Race-specific endurance.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Wed", type: "Full Station Circuit", duration: 75, description: "Complete all 8 Hyrox stations at race effort. Time the full session.",
          skill_variants: { advanced: { description: "Full stations at race effort. Note every station time.", goal: "Station conditioning peak.", sled_weight: "Competition weight", wall_balls: "Unbroken target", rest_between_stations: "Minimal" } } },
        { day: "Thu", type: "Recovery", duration: 35, description: "Mandatory recovery. Cold exposure. 35 min mobility.",
          skill_variants: { advanced: { description: "Non-negotiable at this volume.", goal: "Recovery maximization.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Strength", duration: 70, description: "Heavy station work: Sled Push 8×25m, Farmers 6×50m, Sandbag Lunge 5×25m, BBJ 5×20m.",
          skill_variants: { advanced: { description: "Station conditioning peak. Maximum load.", goal: "Peak station strength.", sled_weight: "Competition weight +10%", wall_balls: "N/A", rest_between_stations: "Minimal" } } },
        { day: "Sat", type: "Long Run", duration: 90, description: "16km easy with last 4km at race pace.",
          skill_variants: { advanced: { description: "Peak long run of the program.", goal: "Aerobic ceiling for sub-60.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Sun", type: "Rest", duration: 0, description: "Full rest. 9 hours sleep minimum.",
          skill_variants: { advanced: { description: "Full rest. Peak week demands peak recovery.", goal: "Full recovery.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
      ]},
      { week: 14, focus: "Full Race Simulation", days: [
        { day: "Mon", type: "Strength", duration: 55, description: "Maintenance only. Squat 4×3, Deadlift 3×2, Press 4×3. No max effort.",
          skill_variants: { advanced: { description: "Taper begins. Maintain strength — don't chase it.", goal: "Maintain without fatigue.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Tue", type: "Race Pace Run", duration: 50, description: "6×1km at race pace with 60 sec rest.",
          skill_variants: { advanced: { description: "Race-sharp legs. All 6 at target race pace.", goal: "Race pace confirmation.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Wed", type: "FULL HYROX SIMULATION", duration: 65, description: "Complete race simulation at race effort. All 8 stations. Time every segment. This predicts race day.",
          skill_variants: { advanced: { description: "Full race effort. Your time today predicts race day. Sub-60 target.", goal: "Sub-60 min simulation confirms race readiness.", sled_weight: "Competition weight", wall_balls: "Unbroken", rest_between_stations: "Minimal" } } },
        { day: "Thu", type: "Rest", duration: 0, description: "Full rest. 2 days after simulation.",
          skill_variants: { advanced: { description: "Full rest. Ice bath if available.", goal: "Recovery after peak effort.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Rest", duration: 0, description: "Full rest.",
          skill_variants: { advanced: { description: "Full rest. Taper well established.", goal: "Full recovery.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Sat", type: "Easy Run", duration: 35, description: "5km very easy. Flush legs.",
          skill_variants: { advanced: { description: "Recovery flush only. No effort.", goal: "Active recovery.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Sun", type: "Rest", duration: 0, description: "Full rest.",
          skill_variants: { advanced: { description: "Full rest. Race is 2 weeks away.", goal: "Full recovery.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
      ]},
      { week: 16, focus: "Race Week — Peak Taper", days: [
        { day: "Mon", type: "Easy Run", duration: 25, description: "4km easy with 4 strides.",
          skill_variants: { advanced: { description: "Light and bouncy. Race-week sharpness.", goal: "Stay sharp.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Tue", type: "Shakeout Stations", duration: 30, description: "1 round each at 60% effort. Confirm race sharpness.",
          skill_variants: { advanced: { description: "60% effort. Any station feeling off — 1 extra easy set.", goal: "Race sharpness confirmation.", sled_weight: "Competition weight", wall_balls: "20 reps", rest_between_stations: "Minimal" } } },
        { day: "Wed", type: "Rest", duration: 0, description: "Full rest.", skill_variants: { advanced: { description: "Full rest. Visualize race pacing strategy.", goal: "Mental race prep.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Thu", type: "Rest", duration: 0, description: "Rest. Carb load. 8-10g/kg carbs.", skill_variants: { advanced: { description: "Glycogen supercompensation. Gear packed.", goal: "Optimal pre-race fueling.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Fri", type: "Rest", duration: 0, description: "Race eve. Full rest.", skill_variants: { advanced: { description: "Gear laid out. Race strategy memorized.", goal: "Race eve readiness.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } },
        { day: "Sat", type: "RACE DAY — ELITE", duration: 60, description: "Sub-60 target. First 3 runs conservative at 4:45/km. Full attack on stations. Empty the tank on the last run.",
          skill_variants: { advanced: { description: "Sub-60 execution. Pacing plan: first 3 runs at 4:45/km, stations at race effort, final runs at 4:30/km.", goal: "Sub-60 minutes.", sled_weight: "Pro category weight", wall_balls: "Unbroken", rest_between_stations: "Race transitions only" } } },
        { day: "Sun", type: "Recovery", duration: 0, description: "Recover. Review splits. Set next target.",
          skill_variants: { advanced: { description: "Protein 2.5g/kg. Ice if needed. Review station splits for next race.", goal: "Recovery and next goal.", sled_weight: "N/A", wall_balls: "N/A", rest_between_stations: "N/A" } } }
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
      { day:"Mon", type:"Lift", focus:"Push", duration:60, description:"Bench Press 4×4-6, Overhead Press 4×4-6, Incline DB Press 3×8-10, Lateral Raise 4×12-15, Tricep Pushdown 3×10-12. Heavy. Progressive overload.",
        skill_variants:{
          novice:{ description:"DB Bench Press 3×12, DB Overhead Press 3×12, DB Lateral Raise 3×15, Tricep Kickback 3×15. Dumbbells only — 3 sets each.", duration:45, distance:0, zone:"Strength", notes:"Dumbbells before barbells. Build the movement pattern first." },
          intermediate:{ description:"Bench Press 4×4-6, Overhead Press 4×4-6, Incline DB Press 3×8-10, Lateral Raise 4×12-15, Tricep Pushdown 3×10-12. Heavy. Progressive overload.", duration:60, distance:0, zone:"Strength", notes:"Add weight when all reps are clean on every set." },
          advanced:{ description:"Bench Press 5×4-6, Overhead Press 5×4-6, Incline DB Press 4×8-10, Lateral Raise 5×12-15, Tricep Pushdown 4×10-12. +20% volume.", duration:75, distance:0, zone:"Strength", notes:"20% more volume — add an extra set to each compound lift." }
        }
      },
      { day:"Tue", type:"Easy Run", distance:5, duration:30, zone:"Zone 2", description:"5km fully conversational. If you can't hold a conversation you're going too fast. This is recovery, not training.",
        skill_variants:{
          novice:{ description:"3km easy jog. Walk 60 sec every 8 min if needed. Fully conversational.", duration:22, distance:3, zone:"Zone 1-2", notes:"3km is the right starting point — build up slowly alongside lifting." },
          intermediate:{ description:"5km fully conversational. If you can't hold a conversation you're going too fast. This is recovery, not training.", duration:30, distance:5, zone:"Zone 2", notes:"Recovery run — slower than you think you need to go." },
          advanced:{ description:"6km easy with 4×20 sec strides at the end.", duration:38, distance:6, zone:"Zone 2 with strides", notes:"Strides maintain speed despite heavy Monday lift." }
        }
      },
      { day:"Wed", type:"Lift", focus:"Pull", duration:60, description:"Deadlift 4×3-5, Barbell Row 4×4-6, Pull Up 3×6-8, Face Pull 3×20, Barbell Curl 3×8-10. Add weight when all reps are clean.",
        skill_variants:{
          novice:{ description:"DB Romanian Deadlift 3×12, DB Row 3×12, Band Pull-Apart 3×20, DB Curl 3×12. Dumbbells only — no barbell yet.", duration:45, distance:0, zone:"Strength", notes:"RDL with dumbbells teaches the hinge pattern safely before loading barbell." },
          intermediate:{ description:"Deadlift 4×3-5, Barbell Row 4×4-6, Pull Up 3×6-8, Face Pull 3×20, Barbell Curl 3×8-10. Add weight when all reps are clean.", duration:60, distance:0, zone:"Strength", notes:"Deadlift is the most important lift in this program — treat it seriously." },
          advanced:{ description:"Deadlift 5×3-5, Barbell Row 5×4-6, Pull Up 4×6-8 weighted, Face Pull 4×20, Barbell Curl 4×8-10. +20% volume.", duration:75, distance:0, zone:"Strength", notes:"Weighted pull-ups separate advanced hybrid athletes." }
        }
      },
      { day:"Thu", type:"Tempo Run", distance:8, duration:50, zone:"Zone 3-4", description:"1km warm up easy. 6km at comfortably hard pace (7/10 effort). 1km cool down. Sustained threshold work.",
        skill_variants:{
          novice:{ description:"Rest day — novice Strength-Biased Hybrid runs 4 days/week. Take this as recovery.", duration:0, distance:0, zone:"Rest", notes:"4 days is enough to build both qualities without overreaching." },
          intermediate:{ description:"1km warm up easy. 6km at comfortably hard pace (7/10 effort). 1km cool down. Sustained threshold work.", duration:50, distance:8, zone:"Zone 3-4", notes:"7/10 effort — you can speak 3-4 words but not a full sentence." },
          advanced:{ description:"1km warm up. 8km at 7.5/10 effort. 1km cool down. Add 4×20 sec strides before cool down.", duration:60, distance:10, zone:"Zone 3-4 with strides", notes:"Extended tempo with strides builds the top-end speed strength-biased runners often lack." }
        }
      },
      { day:"Fri", type:"Lift", focus:"Legs", duration:60, description:"Squat 4×4-6, Romanian Deadlift 3×6-8, Leg Press 3×10-12, Leg Curl 3×12-15, Calf Raise 4×15. Squat is king.",
        skill_variants:{
          novice:{ description:"Rest day — novice Strength-Biased Hybrid runs 4 days/week. Take this as recovery.", duration:0, distance:0, zone:"Rest", notes:"Two lift days is enough while your body adapts. Legs get hit by Mon and Wed." },
          intermediate:{ description:"Squat 4×4-6, Romanian Deadlift 3×6-8, Leg Press 3×10-12, Leg Curl 3×12-15, Calf Raise 4×15. Squat is king.", duration:60, distance:0, zone:"Strength", notes:"Squat is the most important movement in the program — add weight every session." },
          advanced:{ description:"Squat 5×4-6, Romanian Deadlift 4×6-8, Leg Press 4×10-12, Leg Curl 4×12-15, Calf Raise 5×15. +20% volume.", duration:75, distance:0, zone:"Strength", notes:"Heavy legs with Saturday long run teaches your body to run on fatigued legs — race specificity." }
        }
      },
      { day:"Sat", type:"Long Run", distance:14, duration:90, zone:"Zone 2", description:"Start at 12km. Add 1km per week up to 20km. Conversational pace the ENTIRE run. This is not a race. Fueling practice.",
        skill_variants:{
          novice:{ description:"4km easy run. No walk breaks — continuous at very easy pace.", duration:28, distance:4, zone:"Zone 1-2", notes:"Long run starts at 4km for novices and builds slowly. Don't rush to 12km." },
          intermediate:{ description:"Start at 12km. Add 1km per week up to 20km. Conversational pace the ENTIRE run. This is not a race. Fueling practice.", duration:90, distance:14, zone:"Zone 2", notes:"Fuel practice — take water or a gel if over 60 min." },
          advanced:{ description:"Start at 18km. Build to 25km+. Conversational pace with last 3km at marathon pace.", duration:130, distance:20, zone:"Zone 2 with marathon pace finish", notes:"25km+ long runs make the strength-biased hybrid genuinely complete as an athlete." }
        }
      },
      { day:"Sun", type:"Rest", description:"Complete rest. This is where adaptation happens. Don't skip it.",
        skill_variants:{
          novice:{ description:"Complete rest. 4 training days and 3 rest days. This ratio is exactly right for the novice hybrid.", duration:0, distance:0, zone:"Rest", notes:"Rest is where the adaptation happens — it's not wasted time." },
          intermediate:{ description:"Complete rest. This is where adaptation happens. Don't skip it.", duration:0, distance:0, zone:"Rest", notes:"Full rest. Sleep 8+ hours." },
          advanced:{ description:"Complete rest or optional 20 min walk. 9 hours sleep target.", duration:0, distance:0, zone:"Rest", notes:"High volume advanced athletes need full Sunday rest to sustain the weekly load." }
        }
      }
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
      { day:"Mon", type:"Easy Run", distance:8, duration:50, zone:"Zone 2", description:"8km easy Zone 2. Sets the week up. Fully conversational.",
        skill_variants:{
          novice:{ description:"5km easy. Walk 60 sec every 10 min if needed. Fully conversational.", duration:32, distance:5, zone:"Zone 1-2", notes:"5km Monday gives you a sustainable weekly load while strength adapts." },
          intermediate:{ description:"8km easy Zone 2. Sets the week up. Fully conversational.", duration:50, distance:8, zone:"Zone 2", notes:"Sets the aerobic tone for the week — never push this run." },
          advanced:{ description:"10km easy with 6 strides at the end.", duration:62, distance:10, zone:"Zone 2 with strides", notes:"10km Monday supports higher weekly mileage without taxing quality sessions." }
        }
      },
      { day:"Tue", type:"Lift", focus:"Full Body Heavy", duration:45, description:"Squat 3×5, Deadlift 2×5, Bench Press 3×5, Barbell Row 3×5. HEAVY COMPOUNDS ONLY. 45 minutes max. No isolation work — it kills your running legs.",
        skill_variants:{
          novice:{ description:"DB Squat 3×10, DB Romanian Deadlift 3×10, DB Bench 3×10, DB Row 3×10. Dumbbells, 3 sets, 45 min max.", duration:40, distance:0, zone:"Strength", notes:"Dumbbells teach movement patterns without loading the spine before the pattern is learned." },
          intermediate:{ description:"Squat 3×5, Deadlift 2×5, Bench Press 3×5, Barbell Row 3×5. HEAVY COMPOUNDS ONLY. 45 minutes max. No isolation work — it kills your running legs.", duration:45, distance:0, zone:"Strength", notes:"45 minutes max. Every minute past that costs you Wednesday intervals." },
          advanced:{ description:"Squat 4×5, Deadlift 3×5, Bench 4×5, Row 4×5. 50 min max. Add 5lbs every session.", duration:50, distance:0, zone:"Strength", notes:"Heavier compounds — strength must progress or the program breaks." }
        }
      },
      { day:"Wed", type:"Intervals", distance:10, duration:65, zone:"Zone 5", description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. The quality session. Protect this at all costs.",
        skill_variants:{
          novice:{ description:"1km easy warm up. 4×600m at 'comfortably hard' effort with 2 min walk rest. 1km easy cool down.", duration:45, distance:5, zone:"Zone 3-4", notes:"600m reps before 1km reps — build the quality session tolerance first." },
          intermediate:{ description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. The quality session. Protect this at all costs.", duration:65, distance:10, zone:"Zone 5", notes:"The most important session of the week — everything else supports this." },
          advanced:{ description:"1km warm up. 8×1km at 5K pace with 75 sec rest. 1km cool down.", duration:75, distance:12, zone:"Zone 5", notes:"8 reps at 5K pace is elite-level interval training — builds enormous speed reserve." }
        }
      },
      { day:"Thu", type:"Easy Run", distance:6, duration:40, zone:"Zone 2", description:"6km easy recovery. Very slow. Flush the legs from intervals. This is not optional.",
        skill_variants:{
          novice:{ description:"4km very easy. Walk if needed. Flushing Wednesday's intervals.", duration:28, distance:4, zone:"Zone 1-2", notes:"Recovery run after intervals — go slower than feels necessary." },
          intermediate:{ description:"6km easy recovery. Very slow. Flush the legs from intervals. This is not optional.", duration:40, distance:6, zone:"Zone 2", notes:"This run makes Wednesday's session better, not worse. Never skip it." },
          advanced:{ description:"7km easy recovery. Zone 2 strictly.", duration:44, distance:7, zone:"Zone 2", notes:"Higher mileage athletes need more recovery volume between quality sessions." }
        }
      },
      { day:"Fri", type:"Tempo Run", distance:8, duration:55, zone:"Zone 3-4", description:"2km warm up. 5km at half marathon pace. 1km cool down. Sustained effort.",
        skill_variants:{
          novice:{ description:"Rest day — novice Run-Biased Hybrid runs 4 active days/week. Take this as recovery.", duration:0, distance:0, zone:"Rest", notes:"4 active days is enough to build running fitness while adapting to lifting." },
          intermediate:{ description:"2km warm up. 5km at half marathon pace. 1km cool down. Sustained effort.", duration:55, distance:8, zone:"Zone 3-4", notes:"Half marathon pace — controlled, sustainable, 7/10 effort." },
          advanced:{ description:"2km warm up. 6km at half marathon pace. 4×20 sec strides. 1km cool down.", duration:65, distance:10, zone:"Zone 3-4 with strides", notes:"Longer tempo with strides adds a speed element to threshold work." }
        }
      },
      { day:"Sat", type:"Long Run", distance:22, duration:145, zone:"Zone 2", description:"Long run. Start at 18km. Builds to 26km. Conversational pace. Practice fueling — gel every 45 min.",
        skill_variants:{
          novice:{ description:"10km easy. Walk 90 sec every 12 min if needed. Practice taking water on the run.", duration:72, distance:10, zone:"Zone 1-2", notes:"10km long run builds the base before tackling 18-26km distances." },
          intermediate:{ description:"Long run. Start at 18km. Builds to 26km. Conversational pace. Practice fueling — gel every 45 min.", duration:145, distance:22, zone:"Zone 2", notes:"Fueling practice — your gut needs training just like your legs." },
          advanced:{ description:"Long run. Start at 22km. Build to 30km+. Last 5km at marathon pace.", duration:175, distance:26, zone:"Zone 2 with marathon pace finish", notes:"30km long runs make the run-biased hybrid capable of serious race performance." }
        }
      },
      { day:"Sun", type:"Lift", focus:"Full Body Heavy", duration:45, description:"Same as Tuesday. Squat 3×5, Deadlift 2×5, Bench 3×5, Row 3×5. Quick, heavy, done.",
        skill_variants:{
          novice:{ description:"Rest day — novice Run-Biased Hybrid runs 4 active days/week. Take this as full rest.", duration:0, distance:0, zone:"Rest", notes:"After Saturday's long run, Sunday must be rest for novices." },
          intermediate:{ description:"Same as Tuesday. Squat 3×5, Deadlift 2×5, Bench 3×5, Row 3×5. Quick, heavy, done.", duration:45, distance:0, zone:"Strength", notes:"45 minutes. Same weights or heavier than Tuesday. In and out." },
          advanced:{ description:"Squat 4×5, Deadlift 3×5, Bench 4×5, Row 4×5. 50 min max.", duration:50, distance:0, zone:"Strength", notes:"Sunday lifting after Saturday long run is a deliberate training stress — it builds race-specific fatigue resistance." }
        }
      }
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
      { day:"Mon", type:"Lift", focus:"Upper Body Strength", duration:65, description:"Bench Press 4×3-5, Barbell Row 4×3-5, Overhead Press 3×5-6, Pull Up 3×5-8. Heavy compounds. This is your strength day — treat it seriously.",
        skill_variants:{
          novice:{ description:"DB Bench 3×12, DB Row 3×12, DB Overhead Press 3×12, Assisted or Band Pull Up 3×8. Dumbbells, 3 sets.", duration:45, distance:0, zone:"Strength", notes:"Dumbbells build the pattern — barbell comes when the movement is solid." },
          intermediate:{ description:"Bench Press 4×3-5, Barbell Row 4×3-5, Overhead Press 3×5-6, Pull Up 3×5-8. Heavy compounds. This is your strength day — treat it seriously.", duration:65, distance:0, zone:"Strength", notes:"Heavy upper body is the strength anchor of the week." },
          advanced:{ description:"Bench Press 5×3-5, Barbell Row 5×3-5, Overhead Press 4×5-6, Pull Up 4×5-8 weighted. +20% volume.", duration:75, distance:0, zone:"Strength", notes:"Weighted pull-ups and extra sets build the strength ceiling advanced athletes need." }
        }
      },
      { day:"Tue", type:"Speed Work", distance:7, duration:50, zone:"Zone 5", description:"Track session: 1km warm up. 8×400m at mile pace with 60 sec rest. 1km cool down. Pure speed development. This is what makes you fast.",
        skill_variants:{
          novice:{ description:"1km easy warm up. 5×400m at comfortable effort (not sprinting). 90 sec rest. 1km easy cool down.", duration:38, distance:5, zone:"Zone 3-4", notes:"5 reps at moderate effort — build the speed session tolerance before adding reps." },
          intermediate:{ description:"Track session: 1km warm up. 8×400m at mile pace with 60 sec rest. 1km cool down. Pure speed development. This is what makes you fast.", duration:50, distance:7, zone:"Zone 5", notes:"Mile pace should feel like 9/10 effort — controlled explosive speed." },
          advanced:{ description:"1km warm up. 10×400m at faster than mile pace. 50 sec rest. 1km cool down.", duration:58, distance:8, zone:"Zone 5", notes:"10 reps at faster pace with shorter rest builds the speed capacity to run sub-7:00/mile." }
        }
      },
      { day:"Wed", type:"Lift", focus:"Lower Body Strength", duration:65, description:"Squat 5×3-5, Romanian Deadlift 4×5, Bulgarian Split Squat 3×8 each, Leg Curl 3×12, Calf Raise 4×15. Squat heavy — this is your engine.",
        skill_variants:{
          novice:{ description:"DB Goblet Squat 3×12, DB Romanian Deadlift 3×12, Reverse Lunge 3×10 each, Leg Curl 3×12, Calf Raise 3×15. Dumbbells only.", duration:50, distance:0, zone:"Strength", notes:"Goblet squat before barbell back squat — the pattern must be sound first." },
          intermediate:{ description:"Squat 5×3-5, Romanian Deadlift 4×5, Bulgarian Split Squat 3×8 each, Leg Curl 3×12, Calf Raise 4×15. Squat heavy — this is your engine.", duration:65, distance:0, zone:"Strength", notes:"Squat is the single most important lift in this program." },
          advanced:{ description:"Squat 6×3-5, Romanian Deadlift 5×5, Bulgarian Split Squat 4×8 each, Leg Curl 4×12, Calf Raise 5×15. +20% volume.", duration:80, distance:0, zone:"Strength", notes:"High leg volume after Tuesday speed work is intentional — race specificity." }
        }
      },
      { day:"Thu", type:"Easy Run", distance:8, duration:55, zone:"Zone 2", description:"8km easy Zone 2. Active recovery. Never push this run — it undoes the whole program if you do.",
        skill_variants:{
          novice:{ description:"5km easy. Walk 60 sec every 10 min. Fully conversational.", duration:35, distance:5, zone:"Zone 1-2", notes:"Recovery run after Wednesday squats — very easy keeps the legs mobile without adding fatigue." },
          intermediate:{ description:"8km easy Zone 2. Active recovery. Never push this run — it undoes the whole program if you do.", duration:55, distance:8, zone:"Zone 2", notes:"Zone 2 strictly. Pushing this run breaks the whole program." },
          advanced:{ description:"9km easy Zone 2 with 4 strides at the end.", duration:60, distance:9, zone:"Zone 2 with strides", notes:"Strides after easy run maintain speed without taxing the recovery session." }
        }
      },
      { day:"Fri", type:"Lift", focus:"Power + Athletic", duration:65, description:"Power Clean 4×3, Box Jump 4×5, Farmers Carry 4×50m, Sled Push 3×20m, Sandbag Carry 3×30m. Athletic power work — this is what connects strength to sport.",
        skill_variants:{
          novice:{ description:"Rest day — novice Balanced Hybrid runs 4 active days/week (Mon, Tue, Wed, Thu). Take this as recovery.", duration:0, distance:0, zone:"Rest", notes:"4 days gives novices both strength and running stimulus without overreaching." },
          intermediate:{ description:"Power Clean 4×3, Box Jump 4×5, Farmers Carry 4×50m, Sled Push 3×20m, Sandbag Carry 3×30m. Athletic power work — this is what connects strength to sport.", duration:65, distance:0, zone:"Power", notes:"Athletic power converts your strength and speed into something that works in sport." },
          advanced:{ description:"Power Clean 5×3, Box Jump 5×5, Farmers Carry 5×50m, Sled Push 4×20m, Sandbag Carry 4×30m. Optional double session: 20 min Zone 2 run in evening.", duration:75, distance:0, zone:"Power with optional double", notes:"Optional PM run doubles the training stimulus without killing recovery." }
        }
      },
      { day:"Sat", type:"Long Run", distance:18, duration:120, zone:"Zone 2", description:"Long run. Start 14km, build to 22km. Conversational pace. This is where hybrid athletes separate themselves from people who just lift or just run.",
        skill_variants:{
          novice:{ description:"8km easy long run. Walk 90 sec every 12 min. No pressure on pace.", duration:65, distance:8, zone:"Zone 1-2", notes:"8km long run builds the aerobic base for the Balanced Hybrid without overreaching." },
          intermediate:{ description:"Long run. Start 14km, build to 22km. Conversational pace. This is where hybrid athletes separate themselves.", duration:120, distance:18, zone:"Zone 2", notes:"Long run at conversational pace — fueling practice for anything over 90 min." },
          advanced:{ description:"Long run. Start 18km, build to 26km+. Last 4km at marathon pace.", duration:150, distance:22, zone:"Zone 2 with marathon pace finish", notes:"Marathon-pace long run finish builds race-specific fitness unique to hybrid athletes." }
        }
      },
      { day:"Sun", type:"Rest", description:"Non-negotiable full rest. 9 hours sleep target.",
        skill_variants:{
          novice:{ description:"Non-negotiable full rest. Recovery is part of the program.", duration:0, distance:0, zone:"Rest", notes:"Rest is what turns training stress into adaptation." },
          intermediate:{ description:"Non-negotiable full rest. 9 hours sleep target.", duration:0, distance:0, zone:"Rest", notes:"9 hours sleep. This program cannot be sustained on 6 hours." },
          advanced:{ description:"Full rest. 9 hours sleep. Nutrition: protein 2.2g/kg, carbs elevated post-Saturday.", duration:0, distance:0, zone:"Rest", notes:"Advanced Balanced Hybrid training load is only sustainable with maximal recovery." }
        }
      }
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
      { day:"Mon", type:"Lift", focus:"Strength Foundation", duration:65, description:"Squat 4×5, Deadlift 3×4, Overhead Press 4×5, Pull Up 4×6, Farmers Carry 3×40m. The strength base that powers every Hyrox station. Go heavy.",
        skill_variants:{
          novice:{ description:"DB Goblet Squat 3×10, DB Deadlift 3×10, DB Press 3×12, Band Pull Up 3×10, Farmers Carry 2×30m (light). Dumbbells, 3 sets.", duration:50, distance:0, zone:"Strength", notes:"Build the strength base before adding station work — form first, load second." },
          intermediate:{ description:"Squat 4×5, Deadlift 3×4, Overhead Press 4×5, Pull Up 4×6, Farmers Carry 3×40m. The strength base that powers every Hyrox station. Go heavy.", duration:65, distance:0, zone:"Strength", notes:"Every Hyrox station is a strength-endurance test — this is what powers them." },
          advanced:{ description:"Squat 5×5, Deadlift 4×4, Overhead Press 5×5, Pull Up 5×6 weighted, Farmers Carry 4×50m. +20% volume.", duration:75, distance:0, zone:"Strength", notes:"Heavy strength foundation separates sub-60 Hyrox athletes from the field." }
        }
      },
      { day:"Tue", type:"Run", distance:8, duration:50, description:"8km with middle 4km at Hyrox race pace. You run 8km total in Hyrox between stations — this is exactly what you're training.",
        skill_variants:{
          novice:{ description:"5km easy run. Walk 90 sec every 10 min if needed. No pace targets.", duration:38, distance:5, zone:"Zone 1-2", notes:"Build the aerobic base first — race pace running comes after you can run 5km comfortably." },
          intermediate:{ description:"8km with middle 4km at Hyrox race pace. You run 8km total in Hyrox between stations — this is exactly what you're training.", duration:50, distance:8, zone:"Zone 2-4", notes:"Race pace practice — you'll run 1km between each of 8 stations on race day." },
          advanced:{ description:"10km: 2km easy, 6km at race pace, 2km easy. Note km splits.", duration:62, distance:10, zone:"Zone 2-4", notes:"6km at race pace is the hardest running session of the week — builds sub-60 run fitness." }
        }
      },
      { day:"Wed", type:"Lift", focus:"Upper Strength + Station Carry-Over", duration:65, description:"Bench Press 4×5, Barbell Row 4×5, Sandbag Lunge 4×20m, Sled Push 3×20m, Wall Ball 3×20. Direct Hyrox station carry-over built into the lift day.",
        skill_variants:{
          novice:{ description:"DB Bench 3×12, DB Row 3×12, Sandbag Lunge 2×10m (light), Sled Push 2×10m (empty), Wall Ball 2×10 (light). Lighter loads, 3 sets.", duration:50, distance:0, zone:"Strength", notes:"Learning the station movements with lighter loads is how you avoid race-day injury." },
          intermediate:{ description:"Bench Press 4×5, Barbell Row 4×5, Sandbag Lunge 4×20m, Sled Push 3×20m, Wall Ball 3×20. Direct Hyrox station carry-over built into the lift day.", duration:65, distance:0, zone:"Strength", notes:"Station carry-over means every set today improves your Hyrox race." },
          advanced:{ description:"Bench 5×5, Row 5×5, Sandbag Lunge 5×25m, Sled Push 4×25m competition weight, Wall Ball 4×25. +20% volume.", duration:80, distance:0, zone:"Strength", notes:"Competition-weight sled push in training is mandatory for sub-60 athletes." }
        }
      },
      { day:"Thu", type:"Run Intervals", distance:9, duration:60, description:"6×1km at 5K pace with 90 sec rest. Hyrox requires repeated 1km efforts between stations — this is exactly that training.",
        skill_variants:{
          novice:{ description:"4×500m at easy jog pace with 2 min walk rest. Learning to run between hard efforts.", duration:35, distance:4, zone:"Zone 2-3", notes:"500m reps teach the movement pattern of running after exertion — core Hyrox skill." },
          intermediate:{ description:"6×1km at 5K pace with 90 sec rest. Hyrox requires repeated 1km efforts between stations — this is exactly what you're training.", duration:60, distance:9, zone:"Zone 4-5", notes:"6 reps at 5K pace exactly replicates the run demands between Hyrox stations." },
          advanced:{ description:"8×1km at 5K pace with 60 sec rest. Race-simulation density.", duration:70, distance:11, zone:"Zone 4-5", notes:"8 reps with shorter rest simulates the fatigue accumulation of the full Hyrox race." }
        }
      },
      { day:"Fri", type:"Station Circuit", duration:65, description:"SkiErg 1000m, rest 3 min, Row 1000m, rest 3 min, Burpee Broad Jump 50m, rest 3 min, Wall Ball 50 reps, rest 3 min. Station-specific conditioning. This gets harder every week.",
        skill_variants:{
          novice:{ description:"SkiErg 400m, rest 4 min, Row 400m, rest 4 min, Burpee (no jump) 20m, rest 4 min, Wall Ball 15 reps (light). Half distances, extra rest.", duration:45, distance:0, zone:"Station Work", notes:"Half distances and extra rest lets you learn the movements without blowing up." },
          intermediate:{ description:"SkiErg 1000m, rest 3 min, Row 1000m, rest 3 min, Burpee Broad Jump 50m, rest 3 min, Wall Ball 50 reps, rest 3 min. Station-specific conditioning.", duration:65, distance:0, zone:"Station Work", notes:"Note your station times every week — measurable improvement is the goal." },
          advanced:{ description:"SkiErg 1000m, rest 90 sec, Row 1000m, rest 90 sec, Burpee Broad Jump 80m, rest 90 sec, Wall Ball 75 reps unbroken goal, rest 90 sec. Race simulation rest.", duration:70, distance:0, zone:"Station Work", notes:"90 sec rest between stations mirrors race conditions — this is the hardest session of the week." }
        }
      },
      { day:"Sat", type:"Long Run", distance:12, duration:75, description:"10-14km easy. Aerobic base. Hyrox is 60-80% aerobic — this matters more than most people think.",
        skill_variants:{
          novice:{ description:"6km easy run. Walk 90 sec every 10 min if needed. Conversational pace.", duration:48, distance:6, zone:"Zone 1-2", notes:"Aerobic base is the foundation of Hyrox performance — this run is never optional." },
          intermediate:{ description:"10-14km easy. Aerobic base. Hyrox is 60-80% aerobic — this matters more than most people think.", duration:75, distance:12, zone:"Zone 2", notes:"60-80% of Hyrox is aerobic — this long run is your biggest race-day investment." },
          advanced:{ description:"14-18km easy. Last 2km at race pace. Aerobic base plus race specificity.", duration:105, distance:16, zone:"Zone 2 with race pace finish", notes:"18km long run gives the Hyrox Hybrid genuinely elite aerobic capacity." }
        }
      },
      { day:"Sun", type:"Rest", description:"Complete rest. This program is high volume. Sleep is training.",
        skill_variants:{
          novice:{ description:"Complete rest. This program is demanding even at 4 active days. Sleep 8+ hours.", duration:0, distance:0, zone:"Rest", notes:"Rest is not optional — it's where the adaptation from this week's training happens." },
          intermediate:{ description:"Complete rest. This program is high volume. Sleep is training.", duration:0, distance:0, zone:"Rest", notes:"Sleep is training. 8-9 hours." },
          advanced:{ description:"Complete rest. 9 hours sleep. This is the highest-volume program — rest is proportionally more important.", duration:0, distance:0, zone:"Rest", notes:"Advanced Hyrox Hybrid athletes who underslept race worse than those who under-trained." }
        }
      }
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

import { generateRunWeek } from './services/runEngine.js';

// Assemble generateRunWeek() inputs from live app state.
// Safe defaults ensure this works before Phase C onboarding ships.
// Maps the string vocabulary written by onboarding to the 1–5 numeric scale the engine uses.
// "fast"=4, "normal"=3, "slow"=2, "very_slow"=1. Default 3 for anything else/missing.
const RC_MAP = { fast: 4, normal: 3, slow: 2, very_slow: 1 };

// Engine expects "half" not "half_marathon"; normalize any variant to engine keys.
const RACE_TYPE_MAP = { half_marathon: 'half', '10km': '10k' };

const WDAYS_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// Cycles for programs that have deterministic heavy-lower days.
// Only include programs where the leg/lower day can be inferred reliably from the cycle.
// Missing keys return null → heavyLowerDays = [] (safe/cold-start DOMS fallback).
const HEAVY_LOWER_CYCLES = {
  "Push/Pull/Legs":       ["Push","Pull","Legs"],
  "Push/Pull/Legs x2":   ["Push","Pull","Legs","Push","Pull","Legs"],
  "Dumbbell PPL":         ["Push","Pull","Legs"],
  "Upper/Lower":          ["Upper","Lower"],
  "Upper Lower":          ["Upper","Lower"],
  "Dumbbell Upper Lower": ["Upper","Lower"],
  "Bro Split":            ["Chest","Back","Shoulders","Arms","Legs"],
  "Arnold Split":         ["Chest & Back","Shoulders & Arms","Legs"],
  "PHUL":                 ["Upper","Lower","Upper","Lower"],
};
// Focus labels that map to a heavy-lower session.
const HEAVY_LOWER_LABELS = new Set(["Legs","Lower"]);

// Pure function: profile/wPrefs/schedule in → { runDays, liftDays, heavyLowerDays } out.
// Resolution order:
//   1. Explicit wPrefs.dayPlan (Phase C Step 2+ / onboarding writes this)
//   2. Run-only fallback (run_race_type set, not hybrid)
//   3. Hybrid without dayPlan — runDays & liftDays = all training days,
//      heavyLowerDays inferred from program split cycle
export function deriveDayModality(profile, wPrefs, schedule) {
  const sch = schedule || {};
  // Recognize all active (non-rest) schedule types: 'run', 'training', 'cardio', 'hyrox', etc.
  // PlanOnboarding writes 'run' for run-focus days, not 'training', so === 'training' misses them.
  const trainingDays = WDAYS_ORDER.filter(d => sch[d] && sch[d] !== 'rest');
  const isHybrid = !!wPrefs?.isHybrid;
  const hasRunRaceType = !!profile?.run_race_type;

  // Path 1: explicit day-plan (written by onboarding after Step 4, or manually seeded)
  const dp = wPrefs?.dayPlan;
  if (dp && typeof dp === 'object' && Object.keys(dp).length > 0) {
    return {
      runDays:        WDAYS_ORDER.filter(d => !!dp[d]?.run),
      liftDays:       WDAYS_ORDER.filter(d => !!dp[d]?.lift),
      heavyLowerDays: WDAYS_ORDER.filter(d => dp[d]?.liftFocus === 'heavy_lower'),
    };
  }

  // Path 2: run-only account — liftDays and heavyLowerDays are empty
  if (hasRunRaceType && !isHybrid) {
    return { runDays: trainingDays, liftDays: [], heavyLowerDays: [] };
  }

  // Path 3: hybrid (or lifting-only) without dayPlan — infer heavyLowerDays from the
  // program's split cycle. If the cycle can't be resolved confidently, return [].
  const splitType = wPrefs?.splitType || profile?.current_program || '';
  const cycle = HEAVY_LOWER_CYCLES[splitType] || null;
  const heavyLowerDays = cycle
    ? trainingDays.filter((_, i) => HEAVY_LOWER_LABELS.has(cycle[i % cycle.length]))
    : [];

  return {
    runDays: trainingDays,
    liftDays: trainingDays,
    heavyLowerDays,
  };
}

export function buildRunEngineInputs(profile, wPrefs, schedule, weekNum) {
  const WDAYS = WDAYS_ORDER;

  // Bug 5: current5KTime is stored as string "1500" — coerce to Number.
  const _raw5K = wPrefs?.current5KTime
    ?? profile?.current5KTime
    ?? profile?.profile_data?.current5KTime
    ?? null;
  const seconds5K = _raw5K != null ? (Number(_raw5K) || null) : null;

  // Bug 2: default to conservative 2, not schedule-training-days count.
  // wPrefs.currentRunsPerWeek is the *current* run frequency; schedule days are
  // committed/future training slots and include lifting for hybrid users.
  const currentRunsPerWeek = wPrefs?.currentRunsPerWeek != null
    ? Number(wPrefs.currentRunsPerWeek)
    : 2;

  const longestRunMi = wPrefs?.longestRunMi ?? null;

  // Bug 1: recovery_capacity is stored as a string ("fast"/"normal"/"slow"/"very_slow").
  // The engine expects a number 1–5 (3 = baseline). Map it.
  const _rcRaw       = profile?.recovery_capacity ?? wPrefs?.recoveryCapacity ?? 'normal';
  const recoveryCapacity = typeof _rcRaw === 'number'
    ? _rcRaw
    : (RC_MAP[_rcRaw] ?? 3);

  // Bug norm: run_race_type can be "half_marathon" (onboarding map) — normalize to engine keys.
  const _rawDist   = (profile?.run_race_type || wPrefs?.runRaceType || '5k').toLowerCase().trim();
  const goalDistance = RACE_TYPE_MAP[_rawDist] ?? _rawDist;

  // run_target_time is a Postgres interval returned as "H:MM:SS" or "MM:SS"
  const _rawTarget = profile?.run_target_time;
  let goalSeconds  = null;
  if (_rawTarget) {
    const parts = String(_rawTarget).split(':').map(Number);
    if (parts.length === 3) goalSeconds = parts[0]*3600 + parts[1]*60 + parts[2];
    else if (parts.length === 2) goalSeconds = parts[0]*60 + parts[1];
  }

  // Run-plan week anchor — deliberately separate from program_start_date (the LIFTING anchor).
  // A hybrid user who has been lifting for months but just started a 12-week run plan must
  // read as week ~1, not week ~26.
  const planWeeks = Math.max(8, Number(wPrefs?.planWeeks ?? profile?.profile_data?.planWeeks ?? 12) || 12);

  // Resolution order for run plan start:
  //   a. wprefs.runPlanStartDate  — explicit anchor written by Step 4 onboarding
  //   b. race_date − planWeeks×7  — derives the start that makes the plan end on race day
  //   c. program_start_date / startDate  — fallback (lifting anchor; only correct for run-only)
  //   d. today                    — safe last resort
  let runPlanStart = null;
  if (wPrefs?.runPlanStartDate) {
    const d = new Date(wPrefs.runPlanStartDate);
    if (!isNaN(d.getTime())) runPlanStart = d;
  }
  if (!runPlanStart && profile?.run_race_date) {
    const raceDate = new Date(profile.run_race_date);
    if (!isNaN(raceDate.getTime()))
      runPlanStart = new Date(raceDate.getTime() - planWeeks * 7 * 86400000);
  }
  if (!runPlanStart) {
    const fallbackRaw = profile?.program_start_date || profile?.startDate || null;
    const fallback = fallbackRaw ? new Date(fallbackRaw) : null;
    runPlanStart = (fallback && !isNaN(fallback.getTime())) ? fallback : new Date();
  }

  // totalWeeks: race_date vs runPlanStart when race is set; else planWeeks.
  let totalWeeks = planWeeks;
  if (profile?.run_race_date) {
    const raceDate = new Date(profile.run_race_date);
    if (!isNaN(raceDate.getTime())) {
      totalWeeks = Math.max(8, Math.ceil((raceDate - runPlanStart) / (7 * 86400000)));
    }
  }

  const _daysSinceRunStart = Math.max(0, Math.floor((Date.now() - runPlanStart.getTime()) / 86400000));
  const weekInPlan = Math.max(1, Math.floor(_daysSinceRunStart / 7) + 1);
  // Post-race: race date is in the past — do not feed out-of-range week to the engine.
  const isPostRace = weekInPlan > totalWeeks;

  // Experience
  const expRaw   = (profile?.skill_level || wPrefs?.liftExp || 'intermediate').toLowerCase();
  const experience = ['beginner','intermediate','advanced'].includes(expRaw) ? expRaw : 'intermediate';

  // Day-modality separation: run days, lift days, heavy-lower days
  const { runDays, liftDays, heavyLowerDays } = deriveDayModality(profile, wPrefs, schedule);

  const isHybrid        = !!wPrefs?.isHybrid;
  const liftDaysPerWeek = isHybrid ? liftDays.length : 0;
  const domsProfile     = profile?.adaptive_profile?.domsProfile ?? null;

  // For general (no-race) accounts, pass the focus emphasis through to the engine.
  const emphasis = wPrefs?.runFocus || 'consistency';

  return {
    currentAbility: { seconds5K, currentRunsPerWeek, longestRunMi, recoveryCapacity },
    goalRace:        { distance: goalDistance, goalSeconds },
    weekInPlan,
    totalWeeks,
    isPostRace,
    emphasis,
    daysAvailable:   runDays.length >= 2 ? runDays : ['Tue','Thu','Sat'],
    experience,
    liftingLoad:     { liftDaysPerWeek, heavyLowerDays, domsProfile },
  };
}

// Maps engine session types to the display / enrichRunSession vocabulary.
export const RUN_SESSION_TYPE_MAP = {
  long:       'long run',
  threshold:  'tempo',
  intervals:  'interval',
  easy:       'easy',
  maintenance: 'maintenance',
};

// Human-readable heading for each engine session type (used in hero card title).
export const RUN_SESSION_TITLE = {
  long:       'Long Run',
  threshold:  'Tempo Run',
  intervals:  'Intervals',
  easy:       'Easy Run',
  maintenance: 'Maintenance Run',
};

// Returns the FULL generated week object for the current plan week.
// Callers that need more than today's session (week card, week overview) use this.
export function getRunWeek(profile, wPrefs, schedule, weekNum) {
  const inputs = buildRunEngineInputs(profile, wPrefs, schedule, weekNum);
  // Post-race: engine never sees an out-of-range week.
  if (inputs.isPostRace) {
    return {
      sessions:         [],
      weekPhase:        'post-race',
      isPostRace:       true,
      isDownWeek:       false,
      isRaceWeek:       false,
      weeklyVolumeMi:   0,
      coachNote:        'Race complete. Set a new goal to begin your next plan.',
      projectedFinish:  null,
    };
  }
  const week = generateRunWeek(
    inputs.currentAbility,
    inputs.goalRace,
    inputs.weekInPlan,
    inputs.totalWeeks,
    inputs.daysAvailable,
    inputs.experience,
    inputs.liftingLoad,
    inputs.emphasis,
  );

  // Honor wPrefs.longRunDay — if the engine placed the long run on a different day,
  // swap it with the user's preferred day (only if that day has an easy/maintenance session).
  const preferredLongDay = wPrefs?.longRunDay;
  if (preferredLongDay) {
    const sessions  = week.sessions;
    const engineLong = sessions.find(s => s.type === 'long');
    if (engineLong && engineLong.day !== preferredLongDay) {
      const targetIdx = sessions.findIndex(
        s => s.day === preferredLongDay && (s.type === 'easy' || s.type === 'maintenance')
      );
      if (targetIdx !== -1) {
        const engineIdx    = sessions.indexOf(engineLong);
        const origTarget   = sessions[targetIdx];
        sessions[targetIdx] = { ...engineLong, day: preferredLongDay };
        sessions[engineIdx] = {
          day:        engineLong.day,
          type:       'easy',
          distanceMi: origTarget.distanceMi,
          pace:       '{easy}',
          note:       'Easy effort. Zone 2. Conversational throughout.',
        };
      }
    }
  }

  return week;
}

// Returns today's generated run session in the shape callers expect,
// or null when today is not a scheduled run day.
// Returns { isPostRace: true } when the race date is in the past.
export function getTodayRunWorkout(profile, wPrefs, schedule, dayOfWeek, weekNum) {
  const generatedWeek = getRunWeek(profile, wPrefs, schedule, weekNum);
  // Post-race state: surface shows "race complete" message; no session data.
  if (generatedWeek.isPostRace) {
    return {
      isPostRace:  true,
      type:        'rest',
      description: 'Your race is complete. Set a new goal to start your next training plan.',
      distance:    0,
      distanceMi:  0,
    };
  }
  const session = generatedWeek.sessions.find(s => s.day === dayOfWeek);
  if (!session) return null;

  return {
    day:             session.day,
    type:            RUN_SESSION_TYPE_MAP[session.type] || session.type,
    description:     session.note,
    distance:        session.distanceMi,
    distanceMi:      session.distanceMi,
    duration:        Math.round(session.distanceMi * 10),
    pace:            session.pace,
    weekPhase:       generatedWeek.weekPhase,
    isDownWeek:      generatedWeek.isDownWeek,
    isRaceWeek:      generatedWeek.isRaceWeek,
    projectedFinish: generatedWeek.projectedFinish,
    coachNote:       generatedWeek.coachNote,
    weeklyVolumeMi:  generatedWeek.weeklyVolumeMi,
  };
}


export function getTodayHyroxWorkout(programName, weekNumber, dayOfWeek) {
  const program = HYROX_PROGRAM[programName] || HYROX_PROGRAM["12-Week Race Prep"];
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
  if(wPrefs?.isHyrox) return { type:"hyrox", program:HYROX_PROGRAM[wPrefs?.hyroxProgram||"12-Week Race Prep"] };
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
