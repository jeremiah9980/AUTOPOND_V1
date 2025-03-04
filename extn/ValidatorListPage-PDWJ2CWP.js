import{a as F}from"./chunk-EKTFYWKC.js";import"./chunk-ALJHCJYR.js";import"./chunk-SIOA3JYF.js";import{c as S,h as L,j as H,k as W}from"./chunk-B5HUTZOW.js";import"./chunk-TU4CQRN3.js";import"./chunk-I5RT5666.js";import{a as P}from"./chunk-F4B3PU3Z.js";import{a as b}from"./chunk-RAXNGD6N.js";import{a as c,b as f,e as z}from"./chunk-255U7RYV.js";import{A as k,d as V}from"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import{g as I}from"./chunk-MP5POVPU.js";import"./chunk-XNMBE4DK.js";import{b as x}from"./chunk-RE3FKPVD.js";import"./chunk-X5D7DNCH.js";import{a as w}from"./chunk-CNOUWZHQ.js";import{c as C}from"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-HRJPGCUD.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import{j as T}from"./chunk-BL5NQCM4.js";import{db as d}from"./chunk-ONJA4ZEG.js";import{e as r}from"./chunk-RBBZHETH.js";import"./chunk-O5D25TI4.js";import"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import{h as v}from"./chunk-GBKSQA4Y.js";import{L as A}from"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import{Z as y,w as g}from"./chunk-H6ILHDLW.js";import{a as B}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as D,h as u,n as h}from"./chunk-3KENBVE7.js";u();h();var t=D(B());var M=o=>{let{t:e}=m(),{searchResults:i,isLoading:n,hasError:l,isSuccess:a,showApy:s,onRefetch:p,setSearchTerm:E}=k();return t.default.createElement(W,{isLoading:n},l?t.default.createElement(S,{title:e("errorAndOfflineSomethingWentWrong"),description:e("validatorListErrorFetching"),refetch:p}):a&&i.length?t.default.createElement(O,{data:i,showApy:s,setSearchTerm:E}):t.default.createElement(_,null),t.default.createElement(w,null,t.default.createElement(T,{onClick:o.onClose},e("commandCancel"))))},Tt=M,_=()=>{let{t:o}=m();return t.default.createElement(d,{size:16,color:"#777777"},o("validatorListNoResults"))},j=84,O=o=>{let{t:e}=m(),{data:i,showApy:n,setSearchTerm:l}=o,a=(0,t.useRef)();return(0,t.useEffect)(()=>{setTimeout(()=>a.current?.focus(),200)},[]),t.default.createElement(K,null,t.default.createElement(N,null,t.default.createElement(I,{ref:a,tabIndex:0,placeholder:e("commandSearch"),onChange:s=>l(s.currentTarget.value),maxLength:50})),t.default.createElement(J,{showApy:n}),t.default.createElement(L,null,t.default.createElement(A,null,({height:s,width:p})=>t.default.createElement(C,{height:s,itemCount:i.length,itemData:i,itemSize:j,width:p},G))))},G=({index:o,style:e,data:i})=>{let n=i[o];return t.default.createElement("div",{key:n.identityPubkey,style:e},t.default.createElement(Q,{voteAccountPubkey:n.voteAccountPubkey,formattedPercentValue:n.totalApy?y(n.totalApy/100,{format:"0.00%"}):"",activatedStake:n.activatedStake,name:n.info?.name,keybaseUsername:n.info?.keybaseUsername,iconUrl:n.info?.iconUrl}))},K=r.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`,N=r.div`
  position: relative;
`,q=r.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
`,U=r(z).attrs(()=>({iconSize:12,lineHeight:19,fontWeight:500,fontSize:16}))``,J=({showApy:o})=>{let{t:e}=m();return t.default.createElement(q,null,t.default.createElement(U,{tooltipAlignment:"bottomLeft",info:t.default.createElement(f,null,t.default.createElement(c,null,e("validatorInfoDescription")))},e("validatorInfoTooltip")),o?t.default.createElement(U,{tooltipAlignment:"bottomRight",info:t.default.createElement(f,null,t.default.createElement(c,null,e("validatorApyInfoDescription")))},e("validatorApyInfoTooltip")):null)},Q=o=>{let{pushDetailView:e,popDetailView:i}=x(),n=(0,t.useRef)(null),{data:l}=V(o.keybaseUsername),a=o.name??o.keybaseUsername??v(o.voteAccountPubkey);return t.default.createElement(X,{ref:n,onClick:()=>{e(t.default.createElement(F,{voteAccountPubkey:o.voteAccountPubkey,onClose:i}))}},t.default.createElement(Y,{iconUrl:o.iconUrl??l}),t.default.createElement(Z,null,t.default.createElement($,null,t.default.createElement(d,{size:16,weight:600,lineHeight:19,textAlign:"left",noWrap:!0},g(a,20)),t.default.createElement(d,{size:14,color:"#777777",lineHeight:19,textAlign:"left",noWrap:!0},t.default.createElement(P,{format:"0,0"},o.activatedStake))),t.default.createElement(d,{size:14,weight:400,lineHeight:19,textAlign:"left",noWrap:!0},o.formattedPercentValue)))},X=r(H)`
  display: grid;
  grid-template-columns: 44px auto;
  column-gap: 10px;
`,Y=r(b).attrs({width:44})``,Z=r.div`
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: space-between;
`,$=r.div`
  display: flex;
  flex-direction: column;
`;export{M as ValidatorListPage,Tt as default};
//# sourceMappingURL=ValidatorListPage-PDWJ2CWP.js.map
