import{a as $}from"./chunk-GQDR22XT.js";import{a as j}from"./chunk-NZWLQDWO.js";import{a as G}from"./chunk-HPXHWIOV.js";import{a as U}from"./chunk-63JROQVK.js";import{b as Z}from"./chunk-EFNMFXTR.js";import"./chunk-UFMTTPZ2.js";import{b as F}from"./chunk-XKFNC3MJ.js";import{da as K}from"./chunk-VZIPQGVK.js";import{h as B}from"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import{a as x}from"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import{g as Q}from"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import{a as O}from"./chunk-XNMBE4DK.js";import"./chunk-RE3FKPVD.js";import"./chunk-X5D7DNCH.js";import{a as V}from"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-ZON27MKP.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-W27Z2YZM.js";import"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{j as z}from"./chunk-BL5NQCM4.js";import{db as w,x as N}from"./chunk-ONJA4ZEG.js";import{e as s}from"./chunk-RBBZHETH.js";import"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import{$ as L,T as v,ba as k,ca as P,j as W}from"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import{L as D,O as _,a as E,b as A}from"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import{Mb as H,de as M}from"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m as p}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import"./chunk-H6ILHDLW.js";import{a as T}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as y,h as S,n as I}from"./chunk-3KENBVE7.js";S();I();var t=y(T());S();I();var o=y(T());var J=E({marginLeft:4}),Y=s(x).attrs({align:"center",padding:"10px"})`
  background-color: #2a2a2a;
  border-radius: 6px;
  height: 74px;
  margin: 4px 0;
`,R=s.div`
  display: flex;
  align-items: center;
`,tt=s(O)`
  flex: 1;
  min-width: 0;
  text-align: left;
  align-items: normal;
`,et=s(w).attrs({size:16,weight:600,lineHeight:19,noWrap:!0,maxWidth:"175px",textAlign:"left"})``,ot=s(w).attrs({color:"#777777",size:14,lineHeight:17,noWrap:!0})`
  text-align: left;
  margin-top: 5px;
`,it=s.div`
  width: 55px;
  min-width: 55px;
  max-width: 55px;
  height: 55px;
  min-height: 55px;
  max-height: 55px;
  aspect-ratio: 1;
  margin-right: 10px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`,X=o.default.memo(e=>{let{t:n}=p(),{collection:i,unknownItem:m,isHidden:r,isSpam:a,onToggleHidden:d}=e,{name:c,id:h}=i,l=k(i),g=l?.chainData,f=P(i),u=L(l?.media,"image",!1,"small"),C=c||l?.name||m;return o.default.createElement(Y,null,o.default.createElement(it,null,a&&r?o.default.createElement($,{width:32}):u?o.default.createElement(Z,{uri:u}):W(g)?o.default.createElement(j,{...g.utxoDetails}):o.default.createElement(F,{type:"image",width:42})),o.default.createElement(x,null,o.default.createElement(tt,null,o.default.createElement(R,null,o.default.createElement(et,null,C),a?o.default.createElement(N,{className:J,fill:A.colors.legacy.accentWarning,height:16,width:16}):null),o.default.createElement(ot,null,n("collectiblesSearchNrOfItems",{nrOfItems:f})))),o.default.createElement(U,{id:h,label:`${c} visible`,checked:!r,onChange:b=>{d(b.target.checked?"show":"hide")}}))});var nt=74,lt=10,st=nt+lt,rt=20,at=s.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`,mt=s.div`
  position: relative;
  width: 100%;
`,ct=()=>{let{handleHideModalVisibility:e}=K(),{data:n,isPending:i}=M(),{viewState:m,viewStateLoading:r}=v({account:n}),a=(0,t.useCallback)(()=>e("collectiblesVisibility"),[e]),d=(0,t.useMemo)(()=>({...m,handleCloseModal:a}),[a,m]),c=(0,t.useMemo)(()=>i||r,[i,r]);return{data:d,loading:c}},dt=t.default.memo(e=>{let{t:n}=p(),i=(0,t.useRef)(null);return(0,t.useEffect)(()=>{setTimeout(()=>i.current?.focus(),200)},[]),t.default.createElement(t.default.Fragment,null,t.default.createElement(mt,null,t.default.createElement(Q,{ref:i,tabIndex:0,placeholder:n("assetListSearch"),maxLength:H,onChange:e.handleSearch,value:e.searchQuery,name:"Search collectibles"})),t.default.createElement(B,null,t.default.createElement(D,null,({height:m,width:r})=>t.default.createElement(_,{style:{padding:`${rt}px 0`},scrollToIndex:e.searchQuery!==e.debouncedSearchQuery?0:void 0,height:m,width:r,rowCount:e.listItems.length,rowHeight:st,rowRenderer:a=>t.default.createElement(pt,{...a,data:e.listItems,unknownItem:n("assetListUnknownToken"),getIsHidden:e.getIsHidden,getIsSpam:e.getIsSpam,getSpamStatus:e.getSpamStatus,onToggleHidden:e.onToggleHidden})}))))}),pt=e=>{let{index:n,data:i,style:m,unknownItem:r,getIsHidden:a,getIsSpam:d,getSpamStatus:c,onToggleHidden:h}=e,l=i[n],g=a(l),f=d(l),u=c(l),C=(0,t.useCallback)(b=>h({item:l,status:b}),[h,l]);return t.default.createElement("div",{style:m},t.default.createElement(X,{collection:l,unknownItem:r,isHidden:g,isSpam:f,spamStatus:u,onToggleHidden:C}))},ht=()=>{let{data:e,loading:n}=ct(),{t:i}=p();return t.default.createElement(at,null,n?t.default.createElement(G,null):t.default.createElement(dt,{...e}),t.default.createElement(V,null,t.default.createElement(z,{onClick:e.handleCloseModal},i("commandClose"))))},Ft=ht;export{ht as CollectiblesVisibilityPage,Ft as default};
//# sourceMappingURL=CollectiblesVisibilityPage-2ADR55GG.js.map
