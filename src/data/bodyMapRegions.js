export const MUSCLE_TO_BODYMAP={
  'Sternal Pec':'chest','Clavicular Pec':'chest','Serratus':'chest',
  'Anterior Delt':'shoulders-f','Medial Delt':'shoulders-f','Supraspinatus':'shoulders-f',
  'Rear Delt':'rear-delts',
  'Long Head Tricep':'triceps','Lateral Head Tricep':'triceps','Medial Head Tricep':'triceps','Anconeus':'triceps',
  'Long Head Bicep':'biceps','Short Head Bicep':'biceps','Brachialis':'biceps',
  'Forearms':'forearms-f',
  'Abs':'abs','Core':'abs','Obliques':'abs',
  'Hip Flexors':'hip-flexors',
  'Rectus Femoris':'quads','Vastus Lateralis':'quads','Vastus Medialis':'quads','Vastus Intermedius':'quads','Adductors':'quads',
  'Biceps Femoris':'hamstrings','Semitendinosus':'hamstrings','Semimembranosus':'hamstrings',
  'Gluteus Maximus':'glutes','Gluteus Medius':'glutes','Gluteus Minimus':'glutes',
  'Calves':'calves-f',
  'Lats':'lats','Teres Major':'lats','Rhomboids':'lats',
  'Upper Traps':'traps','Mid Traps':'traps','Lower Traps':'traps',
  'Lower Back':'lower-back',
};

export const BODYMAP_COLOR={
  chest:'var(--accent)','shoulders-f':'#FEA020','rear-delts':'#FEA020',
  biceps:'#9C6FFF',triceps:'#9C6FFF','forearms-f':'#9C6FFF','forearms-b':'#9C6FFF',
  abs:'#14C4B3','hip-flexors':'#14C4B3',
  quads:'#22c55e',hamstrings:'#22c55e',glutes:'#22c55e','calves-f':'#22c55e','calves-b':'#22c55e',
  lats:'#60a5fa',traps:'#60a5fa','lower-back':'#60a5fa',
};

export const REGION_LABELS={
  chest:'Chest','shoulders-f':'Shoulders','rear-delts':'Rear Delts',
  biceps:'Biceps',triceps:'Triceps','forearms-f':'Forearms',
  abs:'Core','hip-flexors':'Hip Flexors',
  quads:'Quads',hamstrings:'Hamstrings',glutes:'Glutes','calves-f':'Calves',
  lats:'Back',traps:'Traps','lower-back':'Lower Back',
};

export const ALL_REGIONS=[
  'chest','shoulders-f','biceps','forearms-f','abs','hip-flexors','quads','calves-f',
  'traps','lats','rear-delts','triceps','forearms-b','lower-back','glutes','hamstrings','calves-b',
];
