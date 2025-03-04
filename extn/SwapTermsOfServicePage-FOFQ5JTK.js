import{da as C}from"./chunk-VZIPQGVK.js";import"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import"./chunk-XNMBE4DK.js";import"./chunk-RE3FKPVD.js";import"./chunk-X5D7DNCH.js";import"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-ZON27MKP.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-W27Z2YZM.js";import{a as y}from"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{k as T}from"./chunk-BL5NQCM4.js";import{da as v,db as a}from"./chunk-ONJA4ZEG.js";import{e as o}from"./chunk-RBBZHETH.js";import{Na as u,qa as S}from"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m as w}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import{A as f,Ra as d,z as m}from"./chunk-NMZ7IVPZ.js";import"./chunk-H6ILHDLW.js";import{a as O}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as x,h as c,n as p}from"./chunk-3KENBVE7.js";c();p();var e=x(O());var h=o.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  padding: 16px;
`,k=o.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: -20px;
`,b=o(a).attrs({size:28,weight:500,color:"#FFFFFF"})`
  margin-top: 24px;
`,P=o(a).attrs({size:16,weight:500,color:"#777777"})`
  padding: 0px 5px;
  margin-top: 9px;
  span {
    color: #ffffff;
  }
  label {
    color: #ab9ff2;
    cursor: pointer;
  }
`,F=o.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: fit-content;
`,A=o.div`
  margin-top: auto;
  width: 100%;
`,M=()=>{let{t:i}=w(),{mutateAsync:n}=u(),{handleHideModalVisibility:r,handleShowModalVisibility:t}=C(),{data:[s]}=d(["enable-swapper-skip-review"]),g=(0,e.useCallback)(()=>{t("swapConfirmation",void 0,{event:"showSwapModal",payload:{data:{uiContext:"SwapConfirmation"}}}),r("swapTermsOfService")},[t,r]),l=S({goToConfirmation:g});return{onAgreeClick:(0,e.useCallback)(()=>{n(!0),s?l():(t("swapReview",void 0,{event:"showSwapModal",payload:{data:{uiContext:"SwapReview"}}}),r("swapTermsOfService"))},[t,n,r,s,l]),onCancelClick:()=>{r("swapTermsOfService")},t:i}},B=()=>{self.open(m,"_blank")},L=()=>{self.open(f,"_blank")},_=e.default.memo(({onAgreeClick:i,onCancelClick:n,t:r})=>e.default.createElement(h,null,e.default.createElement(k,null,e.default.createElement(F,null,e.default.createElement(v,null),e.default.createElement(b,null,r("termsOfServicePrimaryText")),e.default.createElement(P,null,e.default.createElement(y,{i18nKey:"termsOfServiceDiscliamerFeesEnabledInterpolated"},"We have revised our Terms of Service. By clicking ",e.default.createElement("span",null,'"I Agree"')," you agree to our new",e.default.createElement("label",{onClick:B},"Terms of Service"),".",e.default.createElement("br",null),e.default.createElement("br",null),"Our new Terms of Service include a new ",e.default.createElement("label",{onClick:L},"fee structure")," for certain products.")))),e.default.createElement(A,null,e.default.createElement(T,{primaryText:r("termsOfServiceActionButtonAgree"),secondaryText:r("commandCancel"),onPrimaryClicked:i,onSecondaryClicked:n})))),V=()=>{let i=M();return e.default.createElement(_,{...i})},Z=V;export{V as SwapTermsOfServicePage,Z as default};
//# sourceMappingURL=SwapTermsOfServicePage-FOFQ5JTK.js.map
