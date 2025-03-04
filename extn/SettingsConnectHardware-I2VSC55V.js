import{a as F,c as L,d as N,g as D}from"./chunk-VFHABPY5.js";import{a as f}from"./chunk-C4XN6RZW.js";import"./chunk-RQCWEYC5.js";import"./chunk-MIKWJ7A3.js";import"./chunk-2FIOI33T.js";import"./chunk-7ZJ2L372.js";import{a as T}from"./chunk-T27XGMXK.js";import"./chunk-AAPFDX7G.js";import"./chunk-E4RFPRVO.js";import"./chunk-DQ537XS3.js";import"./chunk-SHAEZV7V.js";import"./chunk-VZIPQGVK.js";import"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import{a as _}from"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import"./chunk-XNMBE4DK.js";import"./chunk-RE3FKPVD.js";import{a as m}from"./chunk-X5D7DNCH.js";import"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import{e as E}from"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-UW37RX5L.js";import"./chunk-ZON27MKP.js";import{a as g}from"./chunk-GEBJ3DQK.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-ECHGNC3N.js";import"./chunk-W27Z2YZM.js";import"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{a as O,b as $}from"./chunk-BL5NQCM4.js";import{q as P}from"./chunk-ONJA4ZEG.js";import{e as c}from"./chunk-RBBZHETH.js";import"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import{Pd as v,Wd as B}from"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import{g as y}from"./chunk-H6ILHDLW.js";import{a as H}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as b,h as r,n}from"./chunk-3KENBVE7.js";r();n();var o=b(H());r();n();var i=b(H());r();n();var G=c(m)`
  cursor: pointer;
  width: 24px;
  height: 24px;
  transition: background-color 200ms ease;
  background-color: ${t=>t.$isExpanded?"#000":"#333"} !important;
  :hover {
    background-color: #444444;
    svg {
      fill: white;
    }
  }
  svg {
    fill: ${t=>t.$isExpanded?"white":"#666666"};
    transition: fill 200ms ease;
    position: relative;
    ${t=>t.top?`top: ${t.top}px;`:""}
    ${t=>t.right?`right: ${t.right}px;`:""}
  }
`;var U=c(_).attrs({justify:"space-between"})`
  background-color: #222222;
  padding: 10px 16px;
  border-bottom: 1px solid #323232;
  height: 46px;
  opacity: ${t=>t.opacity??"1"};
`,V=c.div`
  display: flex;
  margin-left: 10px;
  > * {
    margin-right: 10px;
  }
`,I=c.div`
  width: 24px;
  height: 24px;
`,M=({onBackClick:t,totalSteps:a,currentStepIndex:p,isHidden:l,showBackButtonOnFirstStep:e,showBackButton:u=!0})=>i.default.createElement(U,{opacity:l?0:1},u&&(e||p!==0)?i.default.createElement(G,{right:1,onClick:t},i.default.createElement(P,null)):i.default.createElement(I,null),i.default.createElement(V,null,y(a).map(s=>{let d=s<=p?"#AB9FF2":"#333";return i.default.createElement(m,{key:s,diameter:12,color:d})})),i.default.createElement(I,null));r();n();var z=()=>{let{mutateAsync:t}=B(),{hardwareStepStack:a,pushStep:p,popStep:l,currentStep:e,setOnConnectHardwareAccounts:u,setOnConnectHardwareDone:w,setExistingAccounts:s}=F(),{data:d=[],isFetched:x,isError:k}=v(),C=E(a,(h,J)=>h?.length===J.length),W=a.length>(C??[]).length,A=C?.length===0,X={initial:{x:A?0:W?150:-150,opacity:A?1:0},animate:{x:0,opacity:1},exit:{opacity:0},transition:{duration:.2}},j=(0,o.useCallback)(()=>{e()?.props.preventBack||(e()?.props.onBackCallback&&e()?.props.onBackCallback?.(),l())},[e,l]);return T(()=>{u(async h=>{await t(h),await g.set(f,!await g.get(f))}),w(()=>self.close()),p(o.default.createElement(D,null))},a.length===0),(0,o.useEffect)(()=>{s({data:d,isFetched:x,isError:k})},[d,x,k,s]),o.default.createElement(L,null,o.default.createElement(M,{totalSteps:3,onBackClick:j,showBackButton:!e()?.props.preventBack,currentStepIndex:a.length-1}),o.default.createElement($,{mode:"wait"},o.default.createElement(O.div,{style:{display:"flex",flexGrow:1},key:`${a.length}_${C?.length}`,...X},o.default.createElement(N,null,e()))))},yt=z;export{yt as default};
//# sourceMappingURL=SettingsConnectHardware-I2VSC55V.js.map
