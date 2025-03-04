import{a as l,c as s}from"./chunk-FPTUM3GF.js";import{a as I}from"./chunk-RQCWEYC5.js";import{X as h,da as T}from"./chunk-VZIPQGVK.js";import"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import"./chunk-XNMBE4DK.js";import"./chunk-RE3FKPVD.js";import"./chunk-X5D7DNCH.js";import"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-ZON27MKP.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-W27Z2YZM.js";import"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{j as g,k as C}from"./chunk-BL5NQCM4.js";import{db as c}from"./chunk-ONJA4ZEG.js";import{e as o}from"./chunk-RBBZHETH.js";import"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import{n as B}from"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import{Db as x,gb as r,ob as y}from"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m as d}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import"./chunk-H6ILHDLW.js";import{a as v}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as k,h as p,n as u}from"./chunk-3KENBVE7.js";p();u();var n=k(v());var M=o.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: scroll;
`,D=o.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 90px;
`,P=o(c).attrs({size:28,weight:500,color:"#FFF"})`
  margin: 16px;
`,S=o(c).attrs({size:14,weight:400,lineHeight:17,color:"#999"})`
  max-width: 275px;

  span {
    color: white;
  }
`,V=({networkId:t,token:a})=>{let{t:i}=d(),{handleHideModalVisibility:f}=T(),m=(0,n.useCallback)(()=>{f("insufficientBalance")},[f]),b=t&&y(x(r.getChainID(t))),{canBuy:w,openBuy:F}=h({caip19:b||"",context:"modal",analyticsEvent:"fiatOnrampFromInsufficientBalance"}),e=t?r.getTokenSymbol(t):i("tokens");return n.default.createElement(M,null,n.default.createElement("div",null,n.default.createElement(D,null,n.default.createElement(I,{type:"failure",backgroundWidth:75}),n.default.createElement(P,null,i("insufficientBalancePrimaryText",{tokenSymbol:e})),n.default.createElement(S,null,i("insufficientBalanceSecondaryText",{tokenSymbol:e})),a?n.default.createElement(B,{borderRadius:8,gap:1,marginTop:32,width:"100%"},n.default.createElement(l,{label:i("insufficientBalanceRemaining")},n.default.createElement(s,{color:"#EB3742"},`${a.balance} ${e}`)),n.default.createElement(l,{label:i("insufficientBalanceRequired")},n.default.createElement(s,null,`${a.required} ${e}`))):null)),w?n.default.createElement(C,{primaryText:i("buyAssetInterpolated",{tokenSymbol:e}),onPrimaryClicked:F,secondaryText:i("commandCancel"),onSecondaryClicked:m}):n.default.createElement(g,{onClick:m},i("commandCancel")))},K=V;export{V as InsufficientBalance,K as default};
//# sourceMappingURL=InsufficientBalance-MTII4FLL.js.map
