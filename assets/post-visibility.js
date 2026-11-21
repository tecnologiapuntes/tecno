"use strict";
(() => {
  function dateStamp(value){const t=Date.parse(String(value||""));return Number.isFinite(t)?t:null;}
  function visible(post,at=Date.now()){
    if(!post || !post.published)return false;
    const date=dateStamp(post.publishAt);
    return date===null || at>=date;
  }
  function videoVisible(v,at=Date.now()){
    if(!v || v.enabled===false)return false;
    const date=dateStamp(v.publishAt);
    return date===null || at>=date;
  }
  window.TI_VISIBILITY={visible,videoVisible,dateStamp};
})();
