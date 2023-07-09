!(function(){"use strict";var Et=Object.defineProperty,wt=Object.defineProperties;var Pt=Object.getOwnPropertyDescriptors;var ie=Object.getOwnPropertySymbols;var Le=Object.prototype.hasOwnProperty,De=Object.prototype.propertyIsEnumerable;var Ze=(y,g,i)=>g in y?Et(y,g,{enumerable:!0,configurable:!0,writable:!0,value:i}):y[g]=i,u=(y,g)=>{for(var i in g||(g={}))Le.call(g,i)&&Ze(y,i,g[i]);if(ie)for(var i of ie(g))De.call(g,i)&&Ze(y,i,g[i]);return y},b=(y,g)=>wt(y,Pt(g));var fe=(y,g)=>{var i={};for(var d in y)Le.call(y,d)&&g.indexOf(d)<0&&(i[d]=y[d]);if(y!=null&&ie)for(var d of ie(y))g.indexOf(d)<0&&De.call(y,d)&&(i[d]=y[d]);return i};(self.webpackChunkhome=self.webpackChunkhome||[]).push([[32],{80313:function(y,g,i){i.r(g),i.d(g,{default:function(){return $t}});var d=i(62435),M=i(16994),N=i(4942),m=i(1413),Z=i(97685),x=i(63556),$=i(12498),S=i(25432),k=["borders","breakpoints","colors","components","config","direction","fonts","fontSizes","fontWeights","letterSpacings","lineHeights","radii","shadows","sizes","space","styles","transition","zIndices"];function Q(e){return(0,S.Kn)(e)?k.every(o=>Object.prototype.hasOwnProperty.call(e,o)):!1}var B=i(38554);function V(e){return typeof e=="function"}function oe(...e){return o=>e.reduce((r,t)=>t(r),o)}var L=e=>function(...r){let t=[...r],n=r[r.length-1];return Q(n)&&t.length>1?t=t.slice(0,t.length-1):n=e,oe(...t.map(s=>a=>V(s)?s(a):P(a,s)))(n)},I=L(x.rS),w=L(x.wE);function P(...e){return B({},...e,A)}function A(e,o,r,t){if((V(e)||V(o))&&Object.prototype.hasOwnProperty.call(t,r))return(...n)=>{const s=V(e)?e(...n):e,a=V(o)?o(...n):o;return B({},s,a,A)}}var R=i(70917),l=i(86074),X=String.raw,q=X`
  :root,
  :host {
    --chakra-vh: 100vh;
  }

  @supports (height: -webkit-fill-available) {
    :root,
    :host {
      --chakra-vh: -webkit-fill-available;
    }
  }

  @supports (height: -moz-fill-available) {
    :root,
    :host {
      --chakra-vh: -moz-fill-available;
    }
  }

  @supports (height: 100dvh) {
    :root,
    :host {
      --chakra-vh: 100dvh;
    }
  }
`,ne=()=>(0,l.jsx)(R.xB,{styles:q}),_=({scope:e=""})=>(0,l.jsx)(R.xB,{styles:X`
      html {
        line-height: 1.5;
        -webkit-text-size-adjust: 100%;
        font-family: system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
        touch-action: manipulation;
      }

      body {
        position: relative;
        min-height: 100%;
        margin: 0;
        font-feature-settings: "kern";
      }

      ${e} :where(*, *::before, *::after) {
        border-width: 0;
        border-style: solid;
        box-sizing: border-box;
        word-wrap: break-word;
      }

      main {
        display: block;
      }

      ${e} hr {
        border-top-width: 1px;
        box-sizing: content-box;
        height: 0;
        overflow: visible;
      }

      ${e} :where(pre, code, kbd,samp) {
        font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 1em;
      }

      ${e} a {
        background-color: transparent;
        color: inherit;
        text-decoration: inherit;
      }

      ${e} abbr[title] {
        border-bottom: none;
        text-decoration: underline;
        -webkit-text-decoration: underline dotted;
        text-decoration: underline dotted;
      }

      ${e} :where(b, strong) {
        font-weight: bold;
      }

      ${e} small {
        font-size: 80%;
      }

      ${e} :where(sub,sup) {
        font-size: 75%;
        line-height: 0;
        position: relative;
        vertical-align: baseline;
      }

      ${e} sub {
        bottom: -0.25em;
      }

      ${e} sup {
        top: -0.5em;
      }

      ${e} img {
        border-style: none;
      }

      ${e} :where(button, input, optgroup, select, textarea) {
        font-family: inherit;
        font-size: 100%;
        line-height: 1.15;
        margin: 0;
      }

      ${e} :where(button, input) {
        overflow: visible;
      }

      ${e} :where(button, select) {
        text-transform: none;
      }

      ${e} :where(
          button::-moz-focus-inner,
          [type="button"]::-moz-focus-inner,
          [type="reset"]::-moz-focus-inner,
          [type="submit"]::-moz-focus-inner
        ) {
        border-style: none;
        padding: 0;
      }

      ${e} fieldset {
        padding: 0.35em 0.75em 0.625em;
      }

      ${e} legend {
        box-sizing: border-box;
        color: inherit;
        display: table;
        max-width: 100%;
        padding: 0;
        white-space: normal;
      }

      ${e} progress {
        vertical-align: baseline;
      }

      ${e} textarea {
        overflow: auto;
      }

      ${e} :where([type="checkbox"], [type="radio"]) {
        box-sizing: border-box;
        padding: 0;
      }

      ${e} input[type="number"]::-webkit-inner-spin-button,
      ${e} input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none !important;
      }

      ${e} input[type="number"] {
        -moz-appearance: textfield;
      }

      ${e} input[type="search"] {
        -webkit-appearance: textfield;
        outline-offset: -2px;
      }

      ${e} input[type="search"]::-webkit-search-decoration {
        -webkit-appearance: none !important;
      }

      ${e} ::-webkit-file-upload-button {
        -webkit-appearance: button;
        font: inherit;
      }

      ${e} details {
        display: block;
      }

      ${e} summary {
        display: list-item;
      }

      template {
        display: none;
      }

      [hidden] {
        display: none !important;
      }

      ${e} :where(
          blockquote,
          dl,
          dd,
          h1,
          h2,
          h3,
          h4,
          h5,
          h6,
          hr,
          figure,
          p,
          pre
        ) {
        margin: 0;
      }

      ${e} button {
        background: transparent;
        padding: 0;
      }

      ${e} fieldset {
        margin: 0;
        padding: 0;
      }

      ${e} :where(ol, ul) {
        margin: 0;
        padding: 0;
      }

      ${e} textarea {
        resize: vertical;
      }

      ${e} :where(button, [role="button"]) {
        cursor: pointer;
      }

      ${e} button::-moz-focus-inner {
        border: 0 !important;
      }

      ${e} table {
        border-collapse: collapse;
      }

      ${e} :where(h1, h2, h3, h4, h5, h6) {
        font-size: inherit;
        font-weight: inherit;
      }

      ${e} :where(button, input, optgroup, select, textarea) {
        padding: 0;
        line-height: inherit;
        color: inherit;
      }

      ${e} :where(img, svg, video, canvas, audio, iframe, embed, object) {
        display: block;
      }

      ${e} :where(img, video) {
        max-width: 100%;
        height: auto;
      }

      [data-js-focus-visible]
        :focus:not([data-focus-visible-added]):not(
          [data-focus-visible-disabled]
        ) {
        outline: none;
        box-shadow: none;
      }

      ${e} select::-ms-expand {
        display: none;
      }

      ${q}
    `}),At=null,Ne=i(16810),ve=i(96452),re={light:"chakra-ui-light",dark:"chakra-ui-dark"};function Ie(e={}){const{preventTransition:o=!0}=e,r={setDataset:t=>{const n=o?r.preventTransition():void 0;document.documentElement.dataset.theme=t,document.documentElement.style.colorScheme=t,n==null||n()},setClassName(t){document.body.classList.add(t?re.dark:re.light),document.body.classList.remove(t?re.light:re.dark)},query(){return window.matchMedia("(prefers-color-scheme: dark)")},getSystemTheme(t){var n;return((n=r.query().matches)!=null?n:t==="dark")?"dark":"light"},addListener(t){const n=r.query(),s=a=>{t(a.matches?"dark":"light")};return typeof n.addListener=="function"?n.addListener(s):n.addEventListener("change",s),()=>{typeof n.removeListener=="function"?n.removeListener(s):n.removeEventListener("change",s)}},preventTransition(){const t=document.createElement("style");return t.appendChild(document.createTextNode("*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),requestAnimationFrame(()=>{requestAnimationFrame(()=>{document.head.removeChild(t)})})}}};return r}var se="chakra-ui-color-mode";function Re(e){return{ssr:!1,type:"localStorage",get(o){if(!(globalThis!=null&&globalThis.document))return o;let r;try{r=localStorage.getItem(e)||o}catch(t){}return r||o},set(o){try{localStorage.setItem(e,o)}catch(r){}}}}var Oe=Re(se);function ge(e,o){const r=e.match(new RegExp(`(^| )${o}=([^;]+)`));return r==null?void 0:r[2]}function ye(e,o){return{ssr:!!o,type:"cookie",get(r){return o?ge(o,e):globalThis!=null&&globalThis.document&&ge(document.cookie,e)||r},set(r){document.cookie=`${e}=${r}; max-age=31536000; path=/`}}}var zt=ye(se),Zt=e=>ye(se,e),Be=i(26245),H=()=>{};function xe(e,o){return e.type==="cookie"&&e.ssr?e.get(o):o}function be(e){const{value:o,children:r,options:{useSystemColorMode:t,initialColorMode:n,disableTransitionOnChange:s}={},colorModeManager:a=Oe}=e,c=n==="dark"?"dark":"light",[f,h]=(0,d.useState)(()=>xe(a,c)),[v,j]=(0,d.useState)(()=>xe(a)),{getSystemTheme:T,setClassName:E,setDataset:C,addListener:W}=(0,d.useMemo)(()=>Ie({preventTransition:s}),[s]),z=n==="system"&&!f?v:f,p=(0,d.useCallback)(O=>{const F=O==="system"?T():O;h(F),E(F==="dark"),C(F),a.set(F)},[a,T,E,C]);(0,Be.G)(()=>{n==="system"&&j(T())},[]),(0,d.useEffect)(()=>{const O=a.get();if(O){p(O);return}if(n==="system"){p("system");return}p(c)},[a,c,n,p]);const U=(0,d.useCallback)(()=>{p(z==="dark"?"light":"dark")},[z,p]);(0,d.useEffect)(()=>{if(t)return W(p)},[t,W,p]);const te=(0,d.useMemo)(()=>({colorMode:o!=null?o:z,toggleColorMode:o?H:U,setColorMode:o?H:p,forced:o!==void 0}),[z,U,p,o]);return(0,l.jsx)($.kc.Provider,{value:te,children:r})}be.displayName="ColorModeProvider";function Ve(e){const o=(0,d.useMemo)(()=>({colorMode:"dark",toggleColorMode:H,setColorMode:H,forced:!0}),[]);return(0,l.jsx)($.kc.Provider,u({value:o},e))}Ve.displayName="DarkMode";function We(e){const o=(0,d.useMemo)(()=>({colorMode:"light",toggleColorMode:H,setColorMode:H,forced:!0}),[]);return(0,l.jsx)($.kc.Provider,u({value:o},e))}We.displayName="LightMode";var Ue=i(81607),Fe=e=>{const{children:o,colorModeManager:r,portalZIndex:t,resetScope:n,resetCSS:s=!0,theme:a={},environment:c,cssVarsRoot:f,disableEnvironment:h,disableGlobalStyle:v}=e,j=(0,l.jsx)(Ue.u,{environment:c,disabled:h,children:o});return(0,l.jsx)(ve.f6,{theme:a,cssVarsRoot:f,children:(0,l.jsxs)(be,{colorModeManager:r,options:a.config,children:[s?(0,l.jsx)(_,{scope:n}):(0,l.jsx)(ne,{}),!v&&(0,l.jsx)(ve.ZL,{}),t?(0,l.jsx)(Ne.h,{zIndex:t,children:j}):j]})})},Ge=(e,o)=>e.find(r=>r.id===o);function pe(e,o){const r=ae(e,o),t=r?e[r].findIndex(n=>n.id===o):-1;return{position:r,index:t}}function ae(e,o){for(const[r,t]of Object.entries(e))if(Ge(t,o))return r}var Lt=(e,o)=>!!ae(e,o);function Ke(e){const o=e.includes("right"),r=e.includes("left");let t="center";return o&&(t="flex-end"),r&&(t="flex-start"),{display:"flex",flexDirection:"column",alignItems:t}}function He(e){const r=e==="top"||e==="bottom"?"0 auto":void 0,t=e.includes("top")?"env(safe-area-inset-top, 0px)":void 0,n=e.includes("bottom")?"env(safe-area-inset-bottom, 0px)":void 0,s=e.includes("left")?void 0:"env(safe-area-inset-right, 0px)",a=e.includes("right")?void 0:"env(safe-area-inset-left, 0px)";return{position:"fixed",zIndex:"var(--toast-z-index, 5500)",pointerEvents:"none",display:"flex",flexDirection:"column",margin:r,top:t,bottom:n,right:s,left:a}}var Je=i(35155);function Ye(e,o){const r=(0,Je.W)(e);(0,d.useEffect)(()=>{if(o==null)return;let t=null;return t=window.setTimeout(()=>{r()},o),()=>{t&&window.clearTimeout(t)}},[o,r])}var Se=i(52366),Qe=i(15947),Xe=i(88361),J=i(82504),qe={initial:e=>{const{position:o}=e,r=["top","bottom"].includes(o)?"y":"x";let t=["top-right","bottom-right"].includes(o)?1:-1;return o==="bottom"&&(t=1),{opacity:0,[r]:t*24}},animate:{opacity:1,y:0,x:0,scale:1,transition:{duration:.4,ease:[.4,0,.2,1]}},exit:{opacity:0,scale:.85,transition:{duration:.2,ease:[.4,0,1,1]}}},Ce=(0,d.memo)(e=>{const{id:o,message:r,onCloseComplete:t,onRequestRemove:n,requestClose:s=!1,position:a="bottom",duration:c=5e3,containerStyle:f,motionVariants:h=qe,toastSpacing:v="0.5rem"}=e,[j,T]=(0,d.useState)(c),E=(0,Qe.hO)();(0,Se.r)(()=>{E||t==null||t()},[E]),(0,Se.r)(()=>{T(c)},[c]);const C=()=>T(null),W=()=>T(c),z=()=>{E&&n()};(0,d.useEffect)(()=>{E&&s&&n()},[E,s,n]),Ye(z,j);const p=(0,d.useMemo)(()=>u({pointerEvents:"auto",maxWidth:560,minWidth:300,margin:v},f),[f,v]),U=(0,d.useMemo)(()=>Ke(a),[a]);return(0,l.jsx)(Xe.E.div,{layout:!0,className:"chakra-toast",variants:h,initial:"initial",animate:"animate",exit:"exit",onHoverStart:C,onHoverEnd:W,custom:{position:a},style:U,children:(0,l.jsx)(J.m.div,{role:"status","aria-atomic":"true",className:"chakra-toast__inner",__css:p,children:(0,S.Pu)(r,{id:o,onClose:z})})})});Ce.displayName="ToastComponent";var le=i(56877);function _e(e){return(0,l.jsx)(le.J,b(u({viewBox:"0 0 24 24"},e),{children:(0,l.jsx)("path",{fill:"currentColor",d:"M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z"})}))}function et(e){return(0,l.jsx)(le.J,b(u({viewBox:"0 0 24 24"},e),{children:(0,l.jsx)("path",{fill:"currentColor",d:"M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm.25,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,12.25,5ZM14.5,18.5h-4a1,1,0,0,1,0-2h.75a.25.25,0,0,0,.25-.25v-4.5a.25.25,0,0,0-.25-.25H10.5a1,1,0,0,1,0-2h1a2,2,0,0,1,2,2v4.75a.25.25,0,0,0,.25.25h.75a1,1,0,1,1,0,2Z"})}))}function Me(e){return(0,l.jsx)(le.J,b(u({viewBox:"0 0 24 24"},e),{children:(0,l.jsx)("path",{fill:"currentColor",d:"M11.983,0a12.206,12.206,0,0,0-8.51,3.653A11.8,11.8,0,0,0,0,12.207,11.779,11.779,0,0,0,11.8,24h.214A12.111,12.111,0,0,0,24,11.791h0A11.766,11.766,0,0,0,11.983,0ZM10.5,16.542a1.476,1.476,0,0,1,1.449-1.53h.027a1.527,1.527,0,0,1,1.523,1.47,1.475,1.475,0,0,1-1.449,1.53h-.027A1.529,1.529,0,0,1,10.5,16.542ZM11,12.5v-6a1,1,0,0,1,2,0v6a1,1,0,1,1-2,0Z"})}))}var ce=i(55227),tt=i(295),[ot,de]=(0,ce.k)({name:"AlertContext",hookName:"useAlertContext",providerName:"<Alert />"}),[nt,ue]=(0,ce.k)({name:"AlertStylesContext",hookName:"useAlertStyles",providerName:"<Alert />"}),ke={info:{icon:et,colorScheme:"blue"},warning:{icon:Me,colorScheme:"orange"},success:{icon:_e,colorScheme:"green"},error:{icon:Me,colorScheme:"red"},loading:{icon:tt.$,colorScheme:"blue"}};function rt(e){return ke[e].colorScheme}function it(e){return ke[e].icon}var me=i(35059),st=i(33179),at=i(91639),Te=(0,me.G)(function(o,r){var t;const v=(0,st.Lr)(o),{status:n="info",addRole:s=!0}=v,a=fe(v,["status","addRole"]),c=(t=o.colorScheme)!=null?t:rt(n),f=(0,at.jC)("Alert",b(u({},o),{colorScheme:c})),h=u({width:"100%",display:"flex",alignItems:"center",position:"relative",overflow:"hidden"},f.container);return(0,l.jsx)(ot,{value:{status:n},children:(0,l.jsx)(nt,{value:f,children:(0,l.jsx)(J.m.div,b(u({"data-status":n,role:s?"alert":void 0,ref:r},a),{className:(0,S.cx)("chakra-alert",o.className),__css:h}))})})});Te.displayName="Alert";function $e(e){const{status:o}=de(),r=it(o),t=ue(),n=o==="loading"?t.spinner:t.icon;return(0,l.jsx)(J.m.span,b(u({display:"inherit","data-status":o},e),{className:(0,S.cx)("chakra-alert__icon",e.className),__css:n,children:e.children||(0,l.jsx)(r,{h:"100%",w:"100%"})}))}$e.displayName="AlertIcon";var je=(0,me.G)(function(o,r){const t=ue(),{status:n}=de();return(0,l.jsx)(J.m.div,b(u({ref:r,"data-status":n},o),{className:(0,S.cx)("chakra-alert__title",o.className),__css:t.title}))});je.displayName="AlertTitle";var Ee=(0,me.G)(function(o,r){const t=ue(),{status:n}=de(),s=u({display:"inline"},t.description);return(0,l.jsx)(J.m.div,b(u({ref:r,"data-status":n},o),{className:(0,S.cx)("chakra-alert__desc",o.className),__css:s}))});Ee.displayName="AlertDescription";var lt=i(86989),ct={top:[],"top-left":[],"top-right":[],"bottom-left":[],bottom:[],"bottom-right":[]},D=dt(ct);function dt(e){let o=e;const r=new Set,t=n=>{o=n(o),r.forEach(s=>s())};return{getState:()=>o,subscribe:n=>(r.add(n),()=>{t(()=>e),r.delete(n)}),removeToast:(n,s)=>{t(a=>b(u({},a),{[s]:a[s].filter(c=>c.id!=n)}))},notify:(n,s)=>{const a=ut(n,s),{position:c,id:f}=a;return t(h=>{var v,j;const E=c.includes("top")?[a,...(v=h[c])!=null?v:[]]:[...(j=h[c])!=null?j:[],a];return b(u({},h),{[c]:E})}),f},update:(n,s)=>{n&&t(a=>{const c=u({},a),{position:f,index:h}=pe(c,n);return f&&h!==-1&&(c[f][h]=b(u(u({},c[f][h]),s),{message:Pe(s)})),c})},closeAll:({positions:n}={})=>{t(s=>{const a=["bottom","bottom-right","bottom-left","top","top-left","top-right"];return(n!=null?n:a).reduce((f,h)=>(f[h]=s[h].map(v=>b(u({},v),{requestClose:!0})),f),u({},s))})},close:n=>{t(s=>{const a=ae(s,n);return a?b(u({},s),{[a]:s[a].map(c=>c.id==n?b(u({},c),{requestClose:!0}):c)}):s})},isActive:n=>!!pe(D.getState(),n).position}}var we=0;function ut(e,o={}){var r,t;we+=1;const n=(r=o.id)!=null?r:we,s=(t=o.position)!=null?t:"bottom";return{id:n,message:e,position:s,duration:o.duration,onCloseComplete:o.onCloseComplete,onRequestRemove:()=>D.removeToast(String(n),s),status:o.status,requestClose:!1,containerStyle:o.containerStyle}}var mt=e=>{const{status:o,variant:r="solid",id:t,title:n,isClosable:s,onClose:a,description:c,colorScheme:f,icon:h}=e,v=t?{root:`toast-${t}`,title:`toast-${t}-title`,description:`toast-${t}-description`}:void 0;return(0,l.jsxs)(Te,{addRole:!1,status:o,variant:r,id:v==null?void 0:v.root,alignItems:"start",borderRadius:"md",boxShadow:"lg",paddingEnd:8,textAlign:"start",width:"auto",colorScheme:f,children:[(0,l.jsx)($e,{children:h}),(0,l.jsxs)(J.m.div,{flex:"1",maxWidth:"100%",children:[n&&(0,l.jsx)(je,{id:v==null?void 0:v.title,children:n}),c&&(0,l.jsx)(Ee,{id:v==null?void 0:v.description,display:"block",children:c})]}),s&&(0,l.jsx)(lt.P,{size:"sm",onClick:a,position:"absolute",insetEnd:1,top:1})]})};function Pe(e={}){const{render:o,toastComponent:r=mt}=e;return n=>typeof o=="function"?o(u(u({},n),e)):(0,l.jsx)(r,u(u({},n),e))}function Dt(e,o){const r=n=>{var s;return b(u(u({},o),n),{position:getToastPlacement((s=n==null?void 0:n.position)!=null?s:o==null?void 0:o.position,e)})},t=n=>{const s=r(n),a=Pe(s);return D.notify(a,s)};return t.update=(n,s)=>{D.update(n,r(s))},t.promise=(n,s)=>{const a=t(b(u({},s.loading),{status:"loading",duration:null}));n.then(c=>t.update(a,u({status:"success",duration:5e3},runIfFn(s.success,c)))).catch(c=>t.update(a,u({status:"error",duration:5e3},runIfFn(s.error,c))))},t.closeAll=D.closeAll,t.close=D.close,t.isActive=D.isActive,t}var ht=i(65820),ft=i(49598),[vt,Nt]=(0,ce.k)({name:"ToastOptionsContext",strict:!1}),gt=e=>{const o=(0,d.useSyncExternalStore)(D.subscribe,D.getState,D.getState),{motionVariants:r,component:t=Ce,portalProps:n}=e,a=Object.keys(o).map(c=>{const f=o[c];return(0,l.jsx)("div",{role:"region","aria-live":"polite",id:`chakra-toast-manager-${c}`,style:He(c),children:(0,l.jsx)(ht.M,{initial:!1,children:f.map(h=>(0,l.jsx)(t,u({motionVariants:r},h),h.id))})},c)});return(0,l.jsx)(ft.h,b(u({},n),{children:a}))},Ae=e=>function(a){var c=a,{children:r,theme:t=e,toastOptions:n}=c,s=fe(c,["children","theme","toastOptions"]);return(0,l.jsxs)(Fe,b(u({theme:t},s),{children:[(0,l.jsx)(vt,{value:n==null?void 0:n.defaultOptions,children:r}),(0,l.jsx)(gt,u({},n))]}))},yt=Ae(x.rS),It=Ae(x.wE),xt=i(44854),bt=i(85598),ee=i(75904),pt=function(o){return{".markdown":{a:{color:(0,ee.x)("brand.500","brand.300")(o)},img:{maxWidth:"full"},"*:not(pre) code":{px:.5,py:1.5,bgColor:(0,ee.x)("gray.50","gray.800")(o),color:(0,ee.x)("brand.500","brand.300")(o),fontSize:"md"},pre:{fontSize:"sm",px:6,bgColor:"gray.50"},table:{th:{color:(0,ee.x)("gray.600","gray.400")(o)},"th, td":{borderColor:(0,ee.x)("gray.100","gray.700")(o)}},ul:{li:{lineHeight:"tall"}},"h1, h2, h3, h4, h5, h6":{cursor:"pointer","> a[aria-hidden]:first-of-type":{float:"left",width:5,paddingInlineEnd:1,marginInlineStart:-6,fontSize:0,textAlign:"left",lineHeight:"inhert","&:hover":{border:0},"> .icon-link":{transitionProperty:"visibility",transitionDuration:".3s","&::before":{content:'"#"',fontSize:"xl"}}},"&:not(:hover) > a[aria-hidden]:first-of-type > .icon-link":{visibility:"hidden"}}}}},St=pt,Ct=function(o){var r=o.children,t=o.config,n=o.brand,s=n===void 0?x.rS.colors.purple:n,a=(0,$.If)(),c=a.colorMode,f=(0,d.useState)(s),h=(0,Z.Z)(f,2),v=h[0],j=h[1],T=(0,d.useMemo)(function(){var C,W,z,p,U,te,O;return I((0,m.Z)((0,m.Z)({initialColorMode:c!=null?c:"system",useSystemColorMode:!1,styles:(0,m.Z)((0,m.Z)((0,m.Z)({},x.rS.styles),(C=t==null?void 0:t.styles)!==null&&C!==void 0?C:{}),{},{global:function(he){var G,K,Y;return(0,m.Z)((0,m.Z)((0,m.Z)({},(G=x.rS.styles.global)!==null&&G!==void 0?G:{}),(K=t==null||(Y=t.styles)===null||Y===void 0?void 0:Y.global)!==null&&K!==void 0?K:{}),{},{body:{p:0}},St(he))}})},t!=null?t:{}),{},{fonts:Object.entries(x.rS.fonts).reduce(function(F,he){var G,K,Y=(0,Z.Z)(he,2),ze=Y[0],jt=Y[1];return(0,m.Z)((0,m.Z)({},F),{},(0,N.Z)({},ze,"Inter Variable, "+((G=t==null||(K=t.fonts)===null||K===void 0?void 0:K[ze])!==null&&G!==void 0?G:jt)))},x.rS.fonts),colors:(0,m.Z)({brand:v},(W=t==null?void 0:t.colors)!==null&&W!==void 0?W:{}),space:(0,m.Z)((0,m.Z)((0,m.Z)({},x.rS.space),(z=t==null?void 0:t.space)!==null&&z!==void 0?z:{}),{},{18:"4.5rem"}),sizes:(0,m.Z)((0,m.Z)((0,m.Z)({},x.rS.sizes),(p=t==null?void 0:t.sizes)!==null&&p!==void 0?p:{}),{},{18:"4.5rem",screenW:"100vw",screenH:"100vh",container:(0,m.Z)((0,m.Z)((0,m.Z)({},x.rS.sizes.container),(U=t==null||(te=t.sizes)===null||te===void 0?void 0:te.container)!==null&&U!==void 0?U:{}),{},{xxl:"1392px"})}),breakpoints:(0,m.Z)((0,m.Z)((0,m.Z)({},x.rS.breakpoints),(O=t==null?void 0:t.breakpoints)!==null&&O!==void 0?O:{}),{},{xxl:"1392px"})}))},[t,c,v]),E=(0,d.useCallback)(function(C){(0,bt.Kn)(C)&&j(C),typeof C=="string"&&C in T.colors&&j(T.colors[C])},[t]);return d.createElement(yt,{theme:T},d.createElement(xt.f,{value:{brand:v,changeBrand:E,config:T}},r))},Mt=Ct,kt=i(43472),Tt=function(){var o,r=(0,M.pC)(),t=(o=(0,kt.Z)())!==null&&o!==void 0?o:{},n=t.brand,s=t.config;return r&&d.createElement(Mt,{brand:n,config:s},r)},$t=Tt},81607:function(y,g,i){i.d(g,{O:function(){return Z},u:function(){return x}});var d=i(26245),M=i(62435),N=i(86074),m=(0,M.createContext)({getDocument(){return document},getWindow(){return window}});m.displayName="EnvironmentContext";function Z({defer:$}={}){const[,S]=(0,M.useReducer)(k=>k+1,0);return(0,d.G)(()=>{$&&S()},[$]),(0,M.useContext)(m)}function x($){const{children:S,environment:k,disabled:Q}=$,B=(0,M.useRef)(null),V=(0,M.useMemo)(()=>k||{getDocument:()=>{var L,I;return(I=(L=B.current)==null?void 0:L.ownerDocument)!=null?I:document},getWindow:()=>{var L,I;return(I=(L=B.current)==null?void 0:L.ownerDocument.defaultView)!=null?I:window}},[k]),oe=!Q||!k;return(0,N.jsxs)(m.Provider,{value:V,children:[S,oe&&(0,N.jsx)("span",{id:"__chakra_env",hidden:!0,ref:B})]})}x.displayName="EnvironmentProvider"},52366:function(y,g,i){i.d(g,{r:function(){return M}});var d=i(62435);function M(N,m){const Z=(0,d.useRef)(!1),x=(0,d.useRef)(!1);(0,d.useEffect)(()=>{if(Z.current&&x.current)return N();x.current=!0},m),(0,d.useEffect)(()=>(Z.current=!0,()=>{Z.current=!1}),[])}},96452:function(y,g,i){i.d(g,{ZL:function(){return I},f6:function(){return Q},eC:function(){return L}});var d=i(12498),M=i(62435);function N(w={}){const{strict:P=!0,errorMessage:A="useContext: `context` is undefined. Seems you forgot to wrap component within the Provider",name:R}=w,l=(0,M.createContext)(void 0);l.displayName=R;function X(){var q;const ne=(0,M.useContext)(l);if(!ne&&P){const _=new Error(A);throw _.name="ContextError",(q=Error.captureStackTrace)==null||q.call(Error,_,X),_}return ne}return[l.Provider,X,l]}var m=i(33179),Z=i(21759),x=i(36597),$=i(11463),S=i(70917),k=i(86074);function Q(w){const{cssVarsRoot:P,theme:A,children:R}=w,l=(0,M.useMemo)(()=>(0,m.c0)(A),[A]);return(0,k.jsxs)($.a,{theme:l,children:[(0,k.jsx)(B,{root:P}),R]})}function B({root:w=":host, :root"}){const P=[w,"[data-theme]"].join(",");return(0,k.jsx)(S.xB,{styles:A=>({[P]:A.__cssVars})})}var[V,oe]=N({name:"StylesContext",errorMessage:"useStyles: `styles` is undefined. Seems you forgot to wrap the components in `<StylesProvider />` "});function L(w){return N({name:`${w}StylesContext`,errorMessage:`useStyles: "styles" is undefined. Seems you forgot to wrap the components in "<${w} />" `})}function I(){const{colorMode:w}=(0,d.If)();return(0,k.jsx)(S.xB,{styles:P=>{const A=(0,Z.Wf)(P,"styles.global"),R=(0,x.Pu)(A,{theme:P,colorMode:w});return R?(0,m.iv)(R)(P):void 0}})}}}]);
}());