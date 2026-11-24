// Recipe timings use total seconds from the first contact with water.
// Pour windows also drive an illustrative flow; weights are targets, not measurements.
const filterRecipes={
  'emi-switch':{
    name:'Switch · Emi Fukahori',style:'hybrid',dose:14,water:200,temp:93,targetEnd:140,
    source:'https://europeancoffeetrip.com/easy-hario-switch-recipe-emi-fukahor/',
    credit:'Emi Fukahori · European Coffee Trip',
    stages:[
      {at:0,label:'Bloom',water:50,valveOpen:false,pourEnd:10,
        instruction:'Keep the valve closed. Pour to 50 g and let the coffee bloom.'},
      {at:30,label:'Pour',water:200,valveOpen:true,pourEnd:70,
        instruction:'Open the valve. Pour another 150 g steadily, reaching 200 g by 1:10.'},
      {at:70,label:'Drawdown',water:200,valveOpen:true,
        instruction:'Stop pouring and let the coffee drain. Aim to finish around 2:20.'}
    ]
  },
  'ole-switch':{
    name:'Switch · Ole Bøen',style:'hybrid',dose:16.5,water:240,temp:96,targetEnd:195,
    source:'https://www.hario-europe.com/blogs/hario-community/ole-kristian-boens-switch-recipe',
    credit:'Ole Kristian Bøen · Hario Europe',
    stages:[
      {at:0,label:'Bloom',water:50,valveOpen:false,pourEnd:10,
        instruction:'Valve closed. Pour 50 g and bloom until 0:40.'},
      {at:40,label:'First pour',water:150,valveOpen:true,pourEnd:70,
        instruction:'Open the valve and pour another 100 g into the centre, reaching 150 g.'},
      {at:90,label:'Second pour',water:240,valveOpen:false,pourEnd:115,
        instruction:'Close the valve. Pour another 90 g in circles, reaching 240 g, and steep.'},
      {at:130,label:'Drawdown',water:240,valveOpen:true,
        instruction:'Open the valve and let the coffee drain. Finish around 3:00–3:15.'}
    ]
  },
  'kurasu-immersion':{
    name:'Switch · Kurasu immersion',style:'immersion',dose:10,water:160,temp:94,targetEnd:null,
    source:'https://kurasu.kyoto/blogs/kurasu-journal/2-brewing-recipes-with-hario-immersion-dripper-switch',
    credit:'Kurasu · immersion recipe',
    stages:[
      {at:0,label:'Fill',water:160,valveOpen:false,pourEnd:15,
        instruction:'Valve closed. Wet the grounds and pour all 160 g within 15 seconds.'},
      {at:15,label:'Steep',water:160,valveOpen:false,
        instruction:'Keep the valve closed and let the coffee steep until 2:00 total time.'},
      {at:120,label:'Stir',water:160,valveOpen:false,
        instruction:'Stir three times. Keep the valve closed until 2:15.'},
      {at:135,label:'Drawdown',water:160,valveOpen:true,
        instruction:'Open the valve. Finish the brew when the dripper has drained.'}
    ]
  }
};
function recipeStatusFor(recipe,milliseconds){
  const seconds=Math.max(0,milliseconds/1000);
  const index=Math.max(0,recipe.stages.findLastIndex(stage=>seconds>=stage.at));
  const stage=recipe.stages[index];
  const end=recipe.stages[index+1]?.at??recipe.targetEnd;
  return {
    index,stage,end,
    remaining:end===null?null:Math.max(0,end-seconds),
    overdue:end===null?0:Math.max(0,seconds-end),
    elapsed:Math.max(0,seconds-stage.at)
  };
}
function recipeWaterAt(recipe,milliseconds){
  const status=recipeStatusFor(recipe,milliseconds);
  const previous=recipe.stages[status.index-1]?.water||0;
  if(!status.stage.pourEnd)return status.stage.water;
  const duration=status.stage.pourEnd-status.stage.at;
  const progress=Math.max(0,Math.min(1,status.elapsed/duration));
  return previous+(status.stage.water-previous)*progress;
}

// Compile editable stage durations into the same absolute timeline as a preset.
function compileRecipe(draft){
  if(!draft.name.trim())throw Error('Give your recipe a name.');
  if(!(draft.dose>0&&draft.dose<=100&&draft.temp>=60&&draft.temp<=100))throw Error('Use a dose up to 100 g and a temperature between 60 and 100°C.');
  if(!draft.stages.length||draft.stages.length>16)throw Error('Use between 1 and 16 stages.');
  let at=0,water=0;
  const stages=draft.stages.map((row,index)=>{
    const last=index===draft.stages.length-1;
    const untimed=last&&draft.openEnd;
    if(!row.label.trim())throw Error('Give every stage a name.');
    if(!untimed&&(!Number.isInteger(row.duration)||row.duration<1||row.duration>3600))throw Error('Stage durations must be whole seconds between 1 and 3600.');
    if(!Number.isFinite(row.water)||row.water<water||row.water>3000)throw Error('Water targets must increase or stay the same, up to 3000 g.');
    if(!Number.isFinite(row.pour)||row.pour<0||(!untimed&&row.pour>row.duration))throw Error('Pour time must fit inside its stage.');
    if(row.water>water&&row.pour===0)throw Error('Add a pour time to each stage that adds water.');
    const stage={at,label:row.label.trim(),water:row.water,valveOpen:draft.style==='pourover'||row.valveOpen,note:row.instruction.trim(),
      instruction:row.instruction.trim()||row.label.trim()+'. '+(draft.style==='pourover'?'':row.valveOpen?'Valve open. ':'Valve closed. ')+(row.water>water?'Pour to '+row.water+' g total.':'Let the coffee rest or drain.')};
    if(row.water>water)stage.pourEnd=at+row.pour;
    water=row.water;
    if(!untimed)at+=row.duration;
    return stage;
  });
  if(water<=0)throw Error('Add a water target for your brew.');
  return {name:draft.name.trim(),style:draft.style,dose:draft.dose,temp:draft.temp,water,
    brewer:draft.style==='pourover'?'Pour over':'Hario Switch',targetEnd:draft.openEnd?null:at,
    stages,credit:'Your recipe',source:''};
}
