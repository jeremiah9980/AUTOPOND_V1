import{a as He}from"./chunk-RQCWEYC5.js";import{a as Ye}from"./chunk-UFMTTPZ2.js";import{a as yt,b as Tt}from"./chunk-XKFNC3MJ.js";import{a as Oe,b as We,c as je}from"./chunk-FILAMIP6.js";import"./chunk-E4RFPRVO.js";import"./chunk-DQ537XS3.js";import"./chunk-SHAEZV7V.js";import{da as Ke}from"./chunk-VZIPQGVK.js";import"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import{a as xt}from"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import{a as y}from"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import{a as Ge,e as Ue}from"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import{a as d}from"./chunk-XNMBE4DK.js";import"./chunk-RE3FKPVD.js";import"./chunk-X5D7DNCH.js";import"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-ZON27MKP.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-W27Z2YZM.js";import"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{a as St,f as ft,g as bt,h as Ct,j as ze,k as ht}from"./chunk-BL5NQCM4.js";import{c as Ve,db as m}from"./chunk-ONJA4ZEG.js";import{e as r}from"./chunk-RBBZHETH.js";import"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import{I as ct,J as oe,K as Be,L as Ne,M as pt,N as mt,P as dt,Q as ut,a as Pe,g as st,h as at}from"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import{x as gt}from"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import{b as $}from"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import{Tc as nt,Wc as it,Yb as $e,wb as Me}from"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import{S as Le,j as De}from"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import{gb as lt,ze as rt}from"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m as Ie}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import{R as Ae,b as Y,fa as I}from"./chunk-H6ILHDLW.js";import{a as ve}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as ke,h as V,n as z}from"./chunk-3KENBVE7.js";V();z();var e=ke(ve());V();z();var g=ke(ve());var Nt="#2D2D2D",Vt=r(St.img)`
  width: 44px;
  height: 44px;
  border-radius: 4px;
  object-fit: cover;
  margin-right: 12px;
`,zt=r.div`
  width: 44px;
  height: 44px;
  border-radius: 4px;
  background-color: ${Nt};
  margin-right: 12px;
`,Et=({src:t,alt:l,mediaType:o})=>{let[n,a]=(0,g.useState)(!1),[c,s]=(0,g.useState)(!1),C={hidden:{opacity:0,display:"none"},visible:{opacity:1,display:"block"}},T=()=>{s(!0)},D=()=>{a(!0)};return n?g.default.createElement(zt,null,g.default.createElement(yt,null,g.default.createElement(Tt,{type:o}))):g.default.createElement(g.Fragment,null,g.default.createElement(Vt,{src:t,alt:l,onError:D,onLoad:T,variants:C,animate:c?"visible":"hidden"}),c?null:g.default.createElement(xt,{aspectRatio:1,width:"44px",height:"44px",backgroundColor:"#434343",borderRadius:"4px",margin:"0 12px 0 0"}))};V();z();var G=ke(ve()),Gt="#21E56F",Ut=(t,l,o)=>Math.abs((t-l)/t)*100<=o,wt=({from:t,to:l,currencySymbol:o})=>{let n=(0,G.useRef)(null),a=bt(n,{once:!0});return(0,G.useEffect)(()=>{if(!a||!n||!l)return;let c=ft(t,l,{duration:.4,delay:.2,ease:"easeOut",onUpdate(s){n.current&&(n.current.textContent=Ut(s,l,2.5)?s===l?`${s} ${o}`:`${s.toFixed(5)} ${o}`:`${Math.trunc(s)} ${o}`)}});return()=>c.stop()},[a,t,l,o]),G.default.createElement("p",{style:{color:Gt,fontSize:"28px",minHeight:"41px",fontWeight:500,lineHeight:"41px"},ref:n})};var Ht="#21E56F",Ot="#EB3742",_="#999999",b="#FFFFFF",Wt="#e2dffe",jt="#AB9FF2",et="#2B2B2B",K="#777777",It="#323232",tt="#222222",Yt="#181818",Kt=r(d)`
  overflow-y: scroll;
  padding-bottom: 50px;
`,_t=r(d)`
  margin-bottom: 24px;
`,kt=r.div`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 14px;
  display: flex;
  width: 100%;
  background-color: ${tt};
  border: 1px solid ${It};
  box-shadow: 0px -4px 6px rgba(0, 0, 0, 0.2);
`,vt=r(ht)`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 14px;
  background-color: ${tt};
  border: 1px solid ${It};
  box-shadow: 0px -4px 6px rgba(0, 0, 0, 0.2);
`,qt=r(d)`
  margin-bottom: 10px;
  padding: 14px;
  border-radius: 6px;
  background-color: ${et};
`,Jt=r(y)`
  margin-bottom: 14px;
`,Qt=r(d)`
  gap: 6px;
`,_e=r.div`
  width: calc(100% + 28px);
  height: 1px;
  position: relative;
  left: -14px;
  right: -14px;
  background-color: ${tt};
`,Xt=r(d)`
  gap: 4px;
  margin-top: 12px;
`,Zt=r(y)`
  justify-content: space-between;
`,Rt=r(d)`
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 14px 14px 10px 14px;
  background-color: ${et};
`,eo=r.img`
  width: 16px;
  height: 16px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 4px;
`,to=r(d)`
  border-radius: 6px;
  padding: 14px 14px 10px 14px;
  background-color: ${et};
`,qe=r(d)`
  position: relative;
  height: 100%;
  align-items: center;
  justify-content: space-between;
`,Je=r(d).attrs({align:"center",justify:"center"})`
  height: 100%;
  position: relative;
  padding-bottom: 50px;
`,Qe=r(m).attrs({size:22,weight:700,color:b,margin:"0 0 8px 0"})``,le=r(m).attrs({size:15,weight:400,color:b})``,Xe=r(m).attrs({size:15,weight:400,color:_})`
  margin: 0 3px;
`,Ze=r(d)`
  margin: 24px 0;
  align-items: center;
  justify-content: center;
`,Re=r(y)`
  gap: 1px;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
`,oo=r(d).attrs({align:"center",justify:"center",margin:"0 0 24px 0"})`
  width: 44px;
  height: 44px;
  position: relative;
  border-radius: 50%;
  background-color: ${Ae("#AB9FF2",.2)};
  box-shadow: 0 0 0 20px ${Ae("#AB9FF2",.2)};
`,At=r.div`
  margin-bottom: 24px;
`,Dt=r(d)`
  gap: 4px;
`,U=r(y)`
  gap: 4px;
  justify-content: space-between;
`,Lt=({collectionFloor:t,currencySymbol:l})=>({collectionFloorFormatted:t?`${I(t)} ${l}`:"-",collectionFloorColor:t?b:_}),Mt=({lastSale:t,currencySymbol:l})=>({lastSaleFormatted:t?`${I(t)} ${l}`:"-",lastSaleColor:t?b:_}),$t=({pnl:t,gasFee:l,currencySymbol:o})=>{let n=`${I(t.minus(l))} ${o}`,a=t.isGreaterThan(0)?Ht:t.isLessThan(0)?Ot:_;return{pnlFormatted:n,pnlColor:a}},Pt=(t,l,o,n)=>l.map(a=>{let c=ct(a.bps);return{label:a.kind==="royalty"?t("collectiblesSellEstimatedRoyaltiesFeesTooltipTitle",{royaltiesPercentage:c}):t("collectiblesSellEstimatedMarketplaceFeesTooltipTitle",{marketplaceFeePercentage:c}),value:`${I(oe(a.bps,o))} ${n}`}}),lo=e.default.memo(({collectible:t,bidSummary:l})=>{let{t:o}=Ie(),n=Ve(),[a,c]=(0,e.useState)(!1),{handleHideModalVisibility:s}=Ke(),{sellSteps:C,refetchSellSteps:T,sellStepsError:D,isSellErrorCode:w,isLoadingSellSteps:k}=Be({collectible:t}),{fungible:L}=nt({key:it(l.collectibleChainId,void 0)}),S=$e({query:{data:l.caip19}}).data?.price,F=pt(l.marketplace,l.collectibleChainId,C.steps,L?.data?.balance),{reset:P,status:M,isLedger:v,executeSellEvmSteps:E,result:f,error:u}=mt(C.orderId,C.steps,F.gasEstimation,T,l,t,S),{data:i}=Le(),{collectibleImage:q,collectibleChainId:H,collectibleName:re,collectionFloor:J,collectionName:ne,currencySymbol:h,lastSale:ie,marketplace:se,marketplaceLogoURL:ae,offerAmount:p,pnl:ce,fees:pe,totalFeeBps:Q,receiveAmount:X,receiveAmountFormatted:me,collectibleChainSymbol:Z}=l,O=Y(F?.gasEvm??0),{collectionFloorFormatted:de,collectionFloorColor:ue}=Lt({collectionFloor:J,currencySymbol:h}),{lastSaleFormatted:ge,lastSaleColor:Se}=Mt({lastSale:ie,currencySymbol:h}),{pnlFormatted:fe,pnlColor:be}=$t({pnl:Y(ce),gasFee:O,currencySymbol:h}),R=Pt(o,pe,p,h),ee=R.length>0,Ce=[{label:o("collectiblesSellMarketplace"),value:se,url:ae,color:b},{label:o("collectiblesSellOffer"),value:`${I(p)} ${h}`,color:b},{label:o("collectiblesSellCollectionFloor"),value:de,color:ue,tooltipContent:o("collectiblesSellCollectionFloorTooltip"),withDivider:!1}],he=[{label:o("collectiblesSellLastSalePrice"),value:ge,color:Se},{label:o("collectiblesSellEstimatedFees"),value:`${Ne({gasFee:O,totalFeeBps:Q,offerAmount:p}).formatted} ${Z}`,withDivider:!0,color:b,tooltipContent:e.default.createElement(Dt,null,ee?R.map(({label:A,value:x})=>e.default.createElement(U,{key:A},e.default.createElement("p",null,A),e.default.createElement("p",null,x))):e.default.createElement(U,null,e.default.createElement("p",null,o("collectiblesSellEstimatedMarketplaceFeeTooltipTitle")),e.default.createElement("p",null,I(oe(Q,p))," ",h)),e.default.createElement(U,null,e.default.createElement("p",null,o("collectiblesSellEstimatedChainFeesTooltipTitle",{chainName:lt.getNetworkName(H)})),e.default.createElement("p",null,o("collectiblesSellEstimatedChainFeesTooltipValue",{chainFeeValue:F?.ethFeeUI??`0 ${Z}}`}))))},{label:o("collectiblesSellEstimatedProfitAndLoss"),value:fe,color:be,tooltipContent:o("collectiblesSellProfitLossTooltip")}],xe={sellStepsError:D,isSellErrorCode:w},ot={hasEnoughGas:F.hasEnoughGas,executeSellError:u},ye=Ye({t:o,apiErrors:xe,clientErrors:ot}),te=t.media?.type??Pe.enum.image,Te=S?`$${Me(X,S)}`:"-",W=(0,e.useCallback)(()=>{P(),T(),c(!1)},[P,c,T]),j=()=>{c(!0),$.capture("collectibleSellAcceptClick"),!ye&&!v&&E()},Fe=()=>{$.capture("collectibleSellCancelClick"),s("instantSell")},B=(0,e.useCallback)(()=>{$.capture("collectibleSellCancelClick"),s("instantSell"),n("/notifications")},[s,n]),N=()=>{if(!i||!f)return;let A=i?.explorers[H],x=De({param:f,explorerType:A,endpoint:"transaction",networkID:H});self.open(x)},Ee=(0,e.useMemo)(()=>{let A=u?Oe(u):!1;return u&&A?e.default.createElement(je,{onRetryClick:W,onCancelClick:B,ledgerActionError:u}):v?e.default.createElement(We,{ledgerApp:"EVM",ledgerAction:()=>E(),cancel:B}):null},[u,v,E,W,B]);return e.default.createElement(Bt,{t:o,error:ye,status:M,ledgerUI:Ee,hasAcceptedOffer:a,collectionName:ne,collectibleName:re,collectibleImage:q,collectibleMediaType:te,receiveAmount:X,receiveAmountFormatted:me,currencySymbol:h,receivedFiatValue:Te,handleCancel:Fe,handleClose:B,handleTxLinkClick:N,handleAccept:j,primaryRows:Ce,secondaryRows:he,handleRetry:W,isPrimaryButtonEnabled:!k})}),ro=e.default.memo(({collectible:t,bidSummary:l})=>{let{t:o}=Ie(),n=Ve(),[a,c]=(0,e.useState)(!1),{handleHideModalVisibility:s}=Ke(),{sellSteps:C,sellStepsError:T,isSellErrorCode:D,isLoadingSellSteps:w,refetchSellSteps:k}=Be({collectible:t}),L=$e({query:{data:l.caip19}}).data?.price,{gas:S,reset:F,status:P,isLedger:M,result:v,executeSellSolanaSteps:E,error:f}=dt(C.orderId,C.steps,l,L),u=S??Y(0),{offerAmount:i,totalFeeBps:q}=l,H=Ne({gasFee:u,totalFeeBps:q,offerAmount:i}),{hasEnoughGas:re}=ut(l),{data:J}=Le(),{collectibleImage:ne,collectibleChainId:h,collectibleName:ie,collectionFloor:se,collectionName:ae,currencySymbol:p,lastSale:ce,marketplace:pe,marketplaceLogoURL:Q,offerAmountFormatted:X,pnl:me,fees:Z,receiveAmount:O,receiveAmountFormatted:de}=l,{collectionFloorFormatted:ue,collectionFloorColor:ge}=Lt({collectionFloor:se,currencySymbol:p}),{lastSaleFormatted:Se,lastSaleColor:fe}=Mt({lastSale:ce,currencySymbol:p}),{pnlFormatted:be,pnlColor:R}=$t({pnl:Y(me),gasFee:u,currencySymbol:p}),ee=Pt(o,Z,i,p),Ce=ee.length>0,he=[{label:o("collectiblesSellMarketplace"),value:pe,url:Q,color:b},{label:o("collectiblesSellOffer"),value:`${X} ${p}`,color:b},{label:o("collectiblesSellCollectionFloor"),value:ue,color:ge,tooltipContent:o("collectiblesSellCollectionFloorTooltip"),withDivider:!1}],xe=[{label:o("collectiblesSellLastSalePrice"),value:Se,color:fe},{label:o("collectiblesSellEstimatedFees"),value:`${H.formatted} ${p}`,withDivider:!0,color:b,tooltipContent:e.default.createElement(Dt,null,Ce?ee.map(({label:x,value:we})=>e.default.createElement(U,{key:x},e.default.createElement("p",null,x),e.default.createElement("p",null,we))):e.default.createElement(U,null,e.default.createElement("p",null,o("collectiblesSellEstimatedMarketplaceFeeTooltipTitle")),e.default.createElement("p",null,I(oe(q,i))," ",p)),e.default.createElement(U,null,e.default.createElement("p",null,o("collectiblesSellTransactionFeeTooltipTitle")),e.default.createElement("p",null,S!==void 0?`${S} ${p}`:"-")))},{label:o("collectiblesSellEstimatedProfitAndLoss"),value:be,color:R,tooltipContent:o("collectiblesSellProfitLossTooltip")}],te=Ye({t:o,apiErrors:{sellStepsError:T,isSellErrorCode:D},clientErrors:{hasEnoughGas:re,executeSellError:f}}),Te=t.media?.type??Pe.enum.image,W=L?`$${Me(O,L)}`:"-",j=(0,e.useCallback)(()=>{F(),k(),c(!1)},[F,c,k]),Fe=()=>{c(!0),$.capture("collectibleSellAcceptClick"),!te&&!M&&E()},B=()=>{$.capture("collectibleSellCancelClick"),s("instantSell")},N=(0,e.useCallback)(()=>{$.capture("collectibleSellCancelClick"),s("instantSell"),n("/notifications")},[s,n]),Ee=()=>{if(!J||!v)return;let x=J?.explorers[h],we=De({param:v,explorerType:x,endpoint:"transaction",networkID:h});self.open(we)},A=(0,e.useMemo)(()=>{let x=f?Oe(f):!1;return f&&x?e.default.createElement(je,{onRetryClick:j,onCancelClick:N,ledgerActionError:f}):M?e.default.createElement(We,{ledgerAction:()=>E(),cancel:N}):null},[f,M,E,j,N]);return e.default.createElement(Bt,{t:o,error:te,status:P,ledgerUI:A,hasAcceptedOffer:a,collectionName:ae,collectibleName:ie,collectibleImage:ne,collectibleMediaType:Te,receiveAmount:O,receiveAmountFormatted:de,currencySymbol:p,receivedFiatValue:W,handleCancel:B,handleClose:N,handleTxLinkClick:Ee,handleAccept:Fe,handleRetry:j,primaryRows:he,secondaryRows:xe,isPrimaryButtonEnabled:!w})}),Bt=({t,error:l,status:o,ledgerUI:n,hasAcceptedOffer:a,collectionName:c,collectibleName:s,collectibleImage:C,collectibleMediaType:T,receiveAmount:D,receiveAmountFormatted:w,currencySymbol:k,receivedFiatValue:L,handleCancel:S,handleClose:F,handleRetry:P,handleAccept:M,handleTxLinkClick:v,primaryRows:E,secondaryRows:f,isPrimaryButtonEnabled:u})=>n&&a&&!l&&o!=="success"?e.default.createElement(e.default.Fragment,null,n):a&&l?e.default.createElement(qe,null,e.default.createElement(Je,null,e.default.createElement(At,null,e.default.createElement(He,{type:"failure"})),e.default.createElement(Ze,null,e.default.createElement(Qe,null,l.title),e.default.createElement(Re,null,e.default.createElement(Xe,null,l.subtitle)))),e.default.createElement(vt,{primaryText:t("commandRetry"),secondaryText:t("commandClose"),onPrimaryClicked:P,onSecondaryClicked:S,primaryTheme:"primary"})):o==="loading"?e.default.createElement(qe,null,e.default.createElement(Je,null,e.default.createElement(oo,null,e.default.createElement(Ct,{diameter:54,color:Wt,trackColor:Yt})),e.default.createElement(Ze,null,e.default.createElement(Qe,null,t("collectiblesSellStatusLoadingTitle")),e.default.createElement(Re,null,e.default.createElement(le,null,s),e.default.createElement(Xe,null,t("collectiblesSellStatusLoadingIsSellingFor")),e.default.createElement(le,null,`${w} ${k}`)))),e.default.createElement(kt,null,e.default.createElement(ze,{onClick:S},t("commandClose")))):o==="success"?e.default.createElement(qe,null,e.default.createElement(Je,null,e.default.createElement(At,null,e.default.createElement(He,{type:"success"})),e.default.createElement(Ze,null,e.default.createElement(Qe,null,t("collectiblesSellStatusSuccessTitle",{collectibleName:s})),e.default.createElement(Re,null,e.default.createElement(le,null,s),e.default.createElement(Xe,null,t("collectiblesSellStatusSuccessWasSold")),e.default.createElement(le,null,`${w} ${k}`)),e.default.createElement(m,{size:16,weight:500,color:jt,margin:"37px 0 0 0",onClick:v},t("collectiblesSellStatusViewTransaction")))),e.default.createElement(kt,null,e.default.createElement(ze,{onClick:F},t("commandClose")))):e.default.createElement(Kt,null,e.default.createElement(_t,null,e.default.createElement(qt,null,e.default.createElement(m,{color:K,size:14,margin:"0 0 13px 0"},t("collectiblesSellYouSell")),e.default.createElement(Jt,null,e.default.createElement(Et,{src:C,alt:s,mediaType:T}),e.default.createElement(Qt,null,e.default.createElement(m,{color:b,size:16,weight:600,lineHeight:19},s??t("collectiblesUnknownCollectible")),e.default.createElement(m,{color:_,size:14,lineHeight:17},c??t("collectiblesUnknownCollection")))),e.default.createElement(_e,null),e.default.createElement(Xt,null,e.default.createElement(Zt,null,e.default.createElement(m,{color:K,size:14},t("collectiblesSellYouReceive")),e.default.createElement(m,{color:K,size:14},L)),e.default.createElement(wt,{from:0,to:w.includes("<")?D:Number(w),currencySymbol:k}))),e.default.createElement(Rt,null,E.map(i=>e.default.createElement(e.Fragment,{key:i.label},e.default.createElement(y,{style:{justifyContent:"space-between"}},e.default.createElement(y,{style:{width:"auto",gap:"2px"}},e.default.createElement(m,{color:K,size:14},i.label),e.default.createElement(Ue,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:17,fontSize:14,fontWeight:500,info:i.tooltipContent?e.default.createElement(Ge,null,i.tooltipContent):null})),e.default.createElement(y,{style:{width:"auto"}},i.url?e.default.createElement(eo,{src:i.url,alt:i.value}):null,e.default.createElement(m,{color:i.color,size:14,weight:500},i.value))),i?.withDivider?e.default.createElement(_e,{style:{margin:"8px 0"}}):null))),e.default.createElement(to,null,f.map(i=>e.default.createElement(e.Fragment,{key:i.label},e.default.createElement(y,{style:{justifyContent:"space-between"}},e.default.createElement(y,{style:{width:"auto",gap:"2px"}},e.default.createElement(m,{color:K,size:14},i.label),e.default.createElement(Ue,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:17,fontSize:14,fontWeight:500,info:i.tooltipContent?e.default.createElement(Ge,null,i.tooltipContent):null})),e.default.createElement(m,{color:i.color,size:14,weight:500},i.value)),i?.withDivider?e.default.createElement(_e,{style:{margin:"8px 0"}}):null)))),e.default.createElement(vt,{primaryText:t("commandAccept"),secondaryText:t("commandCancel"),onPrimaryClicked:M,onSecondaryClicked:S,primaryDisabled:!u,primaryTheme:u?"primary":"default"})),no=({collectible:t,bidSummary:l})=>{let o=at(t?.chainData),n=st(t?.chainData),{data:a}=rt({address:t.owner,networkID:t.chain.id});if(gt(a,"INSTANT_SELL"),o)return e.default.createElement(lo,{collectible:t,bidSummary:l});if(n)return e.default.createElement(ro,{collectible:t,bidSummary:l});throw new Error("Unsupported collectible chain")},el=no;export{lo as EvmInstantSellSummary,no as InstantSellSummary,ro as SolanaInstantSellSummary,el as default};
//# sourceMappingURL=InstantSellSummary-67GSX6UP.js.map
