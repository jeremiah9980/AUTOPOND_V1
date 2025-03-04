import{a as F}from"./chunk-FZVJDBMC.js";import{a as w}from"./chunk-NE7NOA4Z.js";import{a as b}from"./chunk-PDA4Y6VR.js";import"./chunk-FPTUM3GF.js";import"./chunk-RQCWEYC5.js";import"./chunk-FILAMIP6.js";import"./chunk-E4RFPRVO.js";import"./chunk-DQ537XS3.js";import"./chunk-SHAEZV7V.js";import{da as T,x}from"./chunk-VZIPQGVK.js";import"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import"./chunk-XNMBE4DK.js";import{b as g}from"./chunk-RE3FKPVD.js";import"./chunk-X5D7DNCH.js";import{a as y}from"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-ZON27MKP.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-W27Z2YZM.js";import"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{j as P}from"./chunk-BL5NQCM4.js";import"./chunk-ONJA4ZEG.js";import{e as i}from"./chunk-RBBZHETH.js";import{$a as h,Ha as S,_a as R,fa as c,la as f,ra as v}from"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import{x as C}from"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import{de as u}from"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m as d}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import"./chunk-H6ILHDLW.js";import{a as M}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as I,h as l,n as m}from"./chunk-3KENBVE7.js";l();m();var e=I(M());var D=i.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  overflow-y: scroll;
  padding: 16px 16px ${78}px; // footer height + padding
`,E=i.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,H=i.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 16px;
  position: absolute;
  bottom: 0;
`,Q=i.div`
  background-color: #2a2a2a;
  border-radius: 6px;
  width: 100%;

  > *:first-child {
    border-bottom: 1px solid #222222;
  }
`,W=()=>{let{t}=d(),{handleHideModalVisibility:r}=T(),{pushDetailView:n}=g(),{resume:p}=f(),o=c(a=>a.quoteResponse),{data:s}=u(),V=(0,e.useMemo)(()=>s?.addresses.find(a=>a.networkID===o?.sellToken.chainId),[s,o]);(0,e.useEffect)(()=>{S()},[]),C(V,"SWAP_FUNGIBLE");let B=(0,e.useCallback)(()=>n(e.default.createElement(b,null)),[n]),k=v({goToConfirmation:B}),A=(0,e.useCallback)(()=>{p(),r("swapReview")},[r,p]);return{...k,hideSwapReview:A,t}},q=e.default.memo(({buyToken:t,sellToken:r,hideSwapReview:n,onSwap:p,t:o})=>{let{infoRowDisplayStrategy:s}=h();return e.default.createElement(D,null,e.default.createElement(E,null,e.default.createElement(x,{leftButton:{type:"close",onClick:n}},o("swapReviewFlowPrimaryText")),e.default.createElement(Q,null,e.default.createElement(w,{...r,title:o("swapReviewFlowYouPay")}),e.default.createElement(w,{...t,title:o("swapReviewFlowYouReceive")})),e.default.createElement(F,{isSwapReview:!0,rowDisplayStrategy:s})),e.default.createElement(H,null,e.default.createElement(y,{removeFooterExpansion:!0,removeShadowFooter:!0},e.default.createElement(P,{theme:"primary",onClick:p},o("swapReviewFlowActionButtonPrimary")))))}),N=()=>{let t=W();return e.default.createElement(R,null,e.default.createElement(q,{...t}))},Y=()=>e.default.createElement(N,null),ne=Y;export{Y as SwapReviewPage,ne as default};
//# sourceMappingURL=SwapReviewPage-DI3SGJAZ.js.map
