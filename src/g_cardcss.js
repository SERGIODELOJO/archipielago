{const st=document.createElement("style");st.textContent=`
.hand{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:16px;z-index:5;display:flex;gap:0;align-items:flex-end;transition:opacity .6s}
body.sailing .hand,body.sailing .prep{opacity:0;pointer-events:none}
.fc{--c:#e0b45a;position:relative;width:118px;aspect-ratio:2/3;border-radius:10px;background:#15110d;border:3px solid var(--c);box-shadow:0 8px 24px rgba(0,0,0,.6);overflow:hidden;cursor:pointer;transition:transform .25s,margin .25s;font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;flex:none}
.hand .fc{margin-left:-26px}.hand .fc:first-child{margin-left:0}
.hand .fc:nth-child(1){transform:rotate(-7deg) translateY(6px)}.hand .fc:nth-child(2){transform:rotate(0)}.hand .fc:nth-child(3){transform:rotate(7deg) translateY(6px)}
.hand .fc:hover,.hand .fc:focus-visible{transform:translateY(-22px) rotate(0) scale(1.06);z-index:2;outline:none}
.fc[data-t=legendaria]{--c:#f5c542;border-width:4px;box-shadow:0 0 22px rgba(245,197,66,.55),0 8px 24px rgba(0,0,0,.6)}.fc.leg::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,240,190,.35) 48%,transparent 60%);background-size:250% 100%;animation:legsh 3.2s linear infinite;pointer-events:none}@keyframes legsh{0%{background-position:130% 0}100%{background-position:-130% 0}}.legslot{display:flex;justify-content:center;margin:6px 0}.legslot .fc{width:150px}
.fc[data-t=sabotaje]{--c:#a8322a}.fc[data-t=sigilo]{--c:#5a7a95}.fc[data-t=respuesta]{--c:#2f8f7a}
.fc .art{position:absolute;inset:0 0 34%;background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--c) 45%,#000),#0b0907 75%);display:flex;align-items:center;justify-content:center;font-family:"IM Fell English SC",Georgia,serif;font-size:56px;color:color-mix(in srgb,var(--c) 70%,#fff);overflow:hidden}
.fc .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fc .bot{position:absolute;left:0;right:0;bottom:0;height:36%;background:linear-gradient(#2a2118,#16110c);border-top:2px solid var(--c);padding:5px 7px;display:flex;flex-direction:column;gap:2px}
.fc .tp{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--c)}
.fc .nm{font-family:"IM Fell English SC",Georgia,serif;font-size:13px;line-height:1.05}
.fc .tx{font-size:9.5px;line-height:1.2;color:#cdbd98;font-style:italic}
.fc.big{width:min(300px,70vw);border-width:5px;border-radius:16px;cursor:default}
.fc.big .art{font-size:140px}.fc.big .tp{font-size:13px}.fc.big .nm{font-size:26px}.fc.big .tx{font-size:16px}.fc.big .bot{padding:10px 14px;gap:5px}
.fc.back{background:repeating-conic-gradient(from 0deg,#1a130c 0 15deg,#241a10 15deg 30deg);border-color:#e0b45a}
.fc.back::after{content:"";position:absolute;inset:18%;border:2px solid #e0b45a;border-radius:50%;box-shadow:inset 0 0 0 10px rgba(224,180,90,.15)}
.cov{position:fixed;inset:0;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(5,4,3,.7);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .35s,visibility 0s .35s;padding:16px;text-align:center}
.cov.on{opacity:1;visibility:visible;transition:opacity .35s}
.cov .msg{font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;font-size:18px;font-style:italic;max-width:520px;text-shadow:0 1px 4px #000}
.cov .btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.cov button{font:inherit;font-family:"IM Fell English",Georgia,serif;font-size:16px;color:#f3e6c8;background:rgba(10,9,8,.7);border:1px solid rgba(224,180,90,.5);border-radius:999px;padding:9px 16px;cursor:pointer}
.cov button.pri{background:rgba(224,180,90,.3);border-color:#e0b45a}
.flip{animation:flip .9s cubic-bezier(.2,.8,.2,1)}@keyframes flip{0%{transform:perspective(900px) rotateY(180deg) scale(.6);opacity:0}40%{opacity:1}100%{transform:none}}
.fly{position:fixed;z-index:8;pointer-events:none;transition:all .9s cubic-bezier(.3,.7,.2,1)}
.prep{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:200px;z-index:5;font-family:"IM Fell English",Georgia,serif;color:#e0b45a;font-size:14px;font-style:italic;text-align:right;text-shadow:0 1px 3px #000;transition:opacity .6s}
@media (prefers-reduced-motion:reduce){.flip{animation:none}.fly{transition:none}}`;document.head.appendChild(st)}
