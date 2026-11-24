// A travelling stream head, followed by a shorter release from the source.
// Wall time keeps the animation independent of recipe/stage clock changes.
function streamEnvelope(state,active,now,reduced=false){
  const ease=value=>1-Math.pow(1-Math.max(0,Math.min(1,value)),3);
  if(reduced){state.active=active;state.moving=false;return {head:active?1:0,tail:0};}
  if(active&&!state.active){state.started=now;state.stopped=null;}
  if(!active&&state.active)state.stopped=now;
  state.active=active;
  if(state.started==null){state.moving=false;return {head:0,tail:0};}
  const head=ease(((active?now:state.stopped??now)-state.started)/550);
  const tail=active?0:head*ease((now-(state.stopped??now))/320);
  state.moving=active?head<1:tail<head;
  return {head,tail};
}
