import{da as w,x as C}from"./chunk-VZIPQGVK.js";import"./chunk-B5HUTZOW.js";import"./chunk-4BIFBETB.js";import"./chunk-AEGB75R5.js";import"./chunk-TU4CQRN3.js";import"./chunk-GIUU5FZA.js";import"./chunk-I5RT5666.js";import"./chunk-F4B3PU3Z.js";import"./chunk-RAXNGD6N.js";import"./chunk-255U7RYV.js";import"./chunk-RNS57IWG.js";import"./chunk-S24UABH5.js";import"./chunk-GD4PMTOF.js";import"./chunk-MP5POVPU.js";import"./chunk-EGXLQXDH.js";import"./chunk-XNMBE4DK.js";import"./chunk-RE3FKPVD.js";import{a as P}from"./chunk-X5D7DNCH.js";import{a as U}from"./chunk-CNOUWZHQ.js";import"./chunk-VL5EYDTL.js";import"./chunk-3P3EBL6I.js";import"./chunk-OVQZ6HTN.js";import"./chunk-EQDXPIVC.js";import"./chunk-ZON27MKP.js";import"./chunk-I6TBOMK3.js";import"./chunk-7PWA24OU.js";import"./chunk-7KE5H3S3.js";import"./chunk-W27Z2YZM.js";import"./chunk-HRJPGCUD.js";import"./chunk-XJTFMD4C.js";import"./chunk-QY4L72L3.js";import"./chunk-VDM5O2ZT.js";import"./chunk-7ZVEM3WY.js";import"./chunk-VQVTLSDS.js";import{j as M}from"./chunk-BL5NQCM4.js";import{db as F,ha as V}from"./chunk-ONJA4ZEG.js";import{a as E,e as g}from"./chunk-RBBZHETH.js";import{db as B,ua as b,va as L}from"./chunk-ZZPI23JA.js";import"./chunk-UCBZOSRF.js";import"./chunk-ZSQU2ZM6.js";import"./chunk-2THQDEWP.js";import"./chunk-O5D25TI4.js";import"./chunk-PKAXVJFX.js";import"./chunk-DUJHHCZR.js";import"./chunk-YOIJCLV6.js";import"./chunk-TBS5VNTB.js";import"./chunk-BTKBODVJ.js";import"./chunk-EQXZ32NI.js";import"./chunk-GS2UJNU3.js";import"./chunk-R5HJQXZQ.js";import"./chunk-WFPABEAU.js";import"./chunk-PPMPQKRK.js";import"./chunk-UDFQ3C42.js";import"./chunk-P4LRI3S3.js";import"./chunk-GBKSQA4Y.js";import"./chunk-IBEI3NGL.js";import"./chunk-ALR5MBQI.js";import"./chunk-UFPGJN5T.js";import{C as H,X as T,b as p,n as l,o as s,p as v,t as O}from"./chunk-BFV33OZC.js";import"./chunk-MT5RYI7C.js";import"./chunk-EMR4O6UP.js";import"./chunk-S6KJ2BHO.js";import"./chunk-7ZZNCPHU.js";import{m as $}from"./chunk-MNQ7RLHG.js";import"./chunk-N7UFQNLW.js";import"./chunk-NMZ7IVPZ.js";import"./chunk-H6ILHDLW.js";import{a as k}from"./chunk-7X4NV6OJ.js";import"./chunk-UNDMYLJW.js";import{f as I,h as y,n as S}from"./chunk-3KENBVE7.js";y();S();var D=I(k());y();S();var a=I(k());var q=g.div`
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
`,G=g.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  margin: 20px 0 16px;
  width: 100%;
`,J=g(F).attrs({size:28,lineHeight:32,weight:600,color:"#fff"})`
  margin: 20px 0 12px;
`,K=g(F).attrs({size:16,lineHeight:18,weight:400,color:"#777777"})`
  margin-bottom: 32px;
`,N=g.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 2px;
  width: 100%;
  background-color: ${t=>t.theme.backgroundDark};
`,Q=g.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  padding: 10px 8px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${t=>t.selected?"#AB9FF2":"transparent"};
  cursor: pointer;
`,W=g(F).attrs(t=>({size:14,lineHeight:18,weight:t.selected?600:500,color:t.selected?"#222":"#fff"}))`
  text-align: center;
`,Z=g(F).attrs(t=>({size:14,lineHeight:18,weight:500,color:t.severity==="critical"?"#EB3742":"#FFDC62"}))`
  align-self: stretch;
  margin-top: 8px;
  text-align: left;
`,R=g.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`,tt=g.input`
  background: transparent;
  color: #222;
  ::placeholder {
    color: #22222299;
  }
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 18px;
  text-align: right;
  border: none;
  padding: 0;
`,et=()=>{let{handleHideModalVisibility:t}=w(),o=(0,a.useCallback)(()=>{t("swapSettings")},[t]);return b({onDismiss:o})},ot=({options:t,selectedIndex:o,customSlippageValue:i,i18nStrings:n,error:c,submitDisabled:f,onConfirm:m,onSelectOption:d,onChangeCustomSlippage:u,onDismiss:h})=>a.default.createElement(q,null,a.default.createElement(C,{leftButton:{type:"close",onClick:h},titleSize:"small"},n.title),a.default.createElement(G,null,a.default.createElement(P,{diameter:96,color:"#181818"},a.default.createElement(V,{width:38,fill:"#181818"})),a.default.createElement(J,null,n.title),a.default.createElement(K,null,n.subtitle),a.default.createElement(rt,{options:t,selectedIndex:o,customOptionLabel:n.custom,customOptionValue:i,onSelectOption:d,onCustomOptionChange:u}),c?a.default.createElement(Z,{severity:c.severity},c.message):null),a.default.createElement(M,{disabled:f,theme:"primary",onClick:m},n.button)),nt=()=>{let t=et();return a.default.createElement(ot,{...t})},j=nt,it=({value:t,onChangeText:o})=>{let i=n=>{n.target.validity.valid?o(n.target.value):n.preventDefault()};return a.default.createElement(R,null,a.default.createElement(tt,{autoFocus:!t,placeholder:"0.00%",value:t??"",style:t?{width:`${t.length*10}px`,textAlign:"right"}:{width:"100%",textAlign:"center"},onChange:i}),a.default.createElement(W,{selected:!0},t?"%":""))},rt=({options:t,selectedIndex:o,customOptionLabel:i,customOptionValue:n,onSelectOption:c,onCustomOptionChange:f})=>a.default.createElement(N,null,t.map((m,d)=>{let u=d===o,h=d===t.length-1&&u,x=()=>c(d);return a.default.createElement(Q,{key:`segment-control-option-${d}`,selected:u,onClick:x},h?a.default.createElement(it,{value:n,onChangeText:f}):a.default.createElement(W,{selected:u},m==="custom"?i:m))}));y();S();var r=I(k());var lt=g.input`
  background: transparent;
  text-align: center;
  border: none;
  padding: 0;
  font-style: ${p.typography.font.bodySemibold.letterSpacing};
  font-size: ${p.typography.font.bodySemibold.fontSize};
  font-weight: ${p.typography.font.bodySemibold.fontWeight};
  line-height: ${p.typography.font.bodySemibold.lineHeight};
  color: ${p.colors.legacy.textPrimary};
  ::placeholder {
    color: ${p.colors.legacy.textTertiary};
  }
`,st=({value:t,onChangeText:o})=>{let i=n=>{n.target.validity.valid?o(n.target.value):n.preventDefault()};return r.default.createElement(l,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",width:"100%"},r.default.createElement(lt,{autoFocus:!t,placeholder:"0.00%",value:t??"",style:t?{width:`${t.length*10}px`,textAlign:"right"}:{width:"100%",textAlign:"center",minWidth:p.space.positive[48]},onChange:i}),t&&r.default.createElement(s,{font:"bodySemibold",color:"textPrimary"},"%"))},at=({options:t,selectedIndex:o,customOptionLabel:i,customOptionValue:n,onSelectOption:c,onCustomOptionChange:f})=>r.default.createElement(l,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",borderRadius:"row",width:"100%"},t.map((m,d)=>{let u=d===o,h=d===t.length-1&&u,x=()=>c(d);return r.default.createElement(l,{key:`segment-control-option-${d}`,display:"flex",flex:1,direction:"row",paddingX:20,paddingY:14,alignItems:"center",justifyContent:"center",borderRadius:"row",backgroundColor:u?"bgRow":void 0,onPress:x,minWidth:24},h?r.default.createElement(st,{value:n,onChangeText:f}):r.default.createElement(s,{font:"bodySemibold",color:u?"textPrimary":"textSecondary",align:"center"},m==="custom"?i:m))})),dt=({customSlippageValue:t,error:o,i18nStrings:i,options:n,selectedIndex:c,submitDisabled:f,isAutoEnabled:m,autoLearnMoreUrl:d,onSelectOption:u,onChangeCustomSlippage:h,onConfirm:x,onToggleAutoSlippage:X,onDismiss:_})=>r.default.createElement(l,{height:"100%",overflowY:"auto",display:"flex",direction:"column",justifyContent:"space-between",padding:"screen"},r.default.createElement("div",null,r.default.createElement(C,{leftButton:{type:"close",onClick:_},titleSize:"small"},i.title),r.default.createElement(l,{display:"flex",gap:24,direction:"column",alignItems:"center",width:"100%"},r.default.createElement(l,{display:"flex",direction:"column",alignItems:"center"},r.default.createElement(P,{diameter:96,color:"#181818"},r.default.createElement(V,{width:38,fill:"#181818"})),r.default.createElement(s,{font:"heading2Semibold",color:"textPrimary",marginTop:20},i.title)),r.default.createElement(l,{width:"100%"},r.default.createElement(v,{rounded:!0,topLeft:i.auto,end:r.default.createElement(T,{id:"auto-slippage-switch",checked:m,onChange:X})}),r.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},i.autoSubtitle," ",r.default.createElement(s,{font:"caption",color:"accentPrimary",onPress:()=>self.open(d,"_blank")},i.learnMore))),!m&&r.default.createElement(l,{gap:8,display:"flex",direction:"column",alignItems:"center"},r.default.createElement(at,{options:n,selectedIndex:c,customOptionLabel:i.custom,customOptionValue:t,onSelectOption:u,onCustomOptionChange:h}),r.default.createElement(s,{font:"caption",color:"textSecondary"},i.subtitle),o&&r.default.createElement(s,{font:"caption",color:o.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},o.message)))),r.default.createElement(O,{disabled:f,theme:"primary",onClick:x},i.button)),pt=()=>{let{handleHideModalVisibility:t}=w(),o=(0,r.useCallback)(()=>{t("swapSettings")},[t]);return b({onDismiss:o})},z=()=>{let t=pt();return r.default.createElement(dt,{...t})};y();S();var e=I(k());var ct=g.input`
  background: transparent;
  text-align: center;
  border: none;
  padding: 0;
  font-style: ${p.typography.font.bodySemibold.letterSpacing};
  font-size: ${p.typography.font.bodySemibold.fontSize};
  font-weight: ${p.typography.font.bodySemibold.fontWeight};
  line-height: ${p.typography.font.bodySemibold.lineHeight};
  color: ${p.colors.legacy.textPrimary};
  ::placeholder {
    color: ${p.colors.legacy.textTertiary};
  }
`,mt=({value:t,onChangeText:o})=>{let i=n=>{n.target.validity.valid?o(n.target.value):n.preventDefault()};return e.default.createElement(l,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",width:"100%"},e.default.createElement(ct,{autoFocus:!t,placeholder:"0.00%",value:t??"",style:t?{width:`${t.length*10}px`,textAlign:"right"}:{width:"100%",textAlign:"center",minWidth:p.space.positive[48]},onChange:i}),t&&e.default.createElement(s,{font:"bodySemibold",color:"textPrimary"},"%"))},ut=({options:t,selectedIndex:o,customOptionLabel:i,customOptionValue:n,onSelectOption:c,onCustomOptionChange:f})=>e.default.createElement(l,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",borderRadius:"row",width:"100%"},t.map((m,d)=>{let u=d===o,h=d===t.length-1&&u,x=()=>c(d);return e.default.createElement(l,{key:`segment-control-option-${d}`,display:"flex",flex:1,direction:"row",paddingX:20,paddingY:14,alignItems:"center",justifyContent:"center",borderRadius:"row",backgroundColor:u?"bgRow":void 0,onPress:x,minWidth:24},h?e.default.createElement(mt,{value:n,onChangeText:f}):e.default.createElement(s,{font:"body",color:u?"textPrimary":"textSecondary",align:"center"},m==="custom"?i:m))})),gt=({slippageSettingsProps:t,priorityFeeSettingsProps:o,onConfirm:i,onDismiss:n,submitDisabled:c})=>{let{t:f}=$();return e.default.createElement(l,{height:"100%",display:"flex",direction:"column",justifyContent:"space-between"},e.default.createElement(l,{flex:1,overflowY:"auto",padding:"screen"},e.default.createElement("div",null,e.default.createElement(C,{leftButton:{type:"close",onClick:n},titleSize:"small"},f("swapSettingsTitle")),e.default.createElement(l,{display:"flex",gap:24,direction:"column",width:"100%"},e.default.createElement(l,{width:"100%"},e.default.createElement(s,{font:"title3",align:"left",color:"textSecondary",marginBottom:12},t.i18nStrings.title),e.default.createElement(v,{rounded:!0,topLeft:t.i18nStrings.auto,end:e.default.createElement(T,{id:"auto-slippage-switch",checked:t.isAutoEnabled,onChange:t.onToggleAutoSlippage})}),e.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},t.i18nStrings.autoSubtitle," ",e.default.createElement(s,{font:"caption",color:"accentPrimary",onPress:()=>self.open(t.autoLearnMoreUrl,"_blank")},t.i18nStrings.learnMore))),!t.isAutoEnabled&&e.default.createElement(l,{gap:8,display:"flex",direction:"column",alignItems:"center"},e.default.createElement(ut,{options:t.options,selectedIndex:t.selectedIndex,customOptionLabel:t.i18nStrings.custom,customOptionValue:t.customSlippageValue,onSelectOption:t.onSelectOption,onCustomOptionChange:t.onChangeCustomSlippage}),e.default.createElement(s,{font:"caption",color:"textSecondary"},t.i18nStrings.subtitle),t.error&&e.default.createElement(s,{font:"caption",color:t.error.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},t.error.message)),e.default.createElement(l,{width:"100%"},e.default.createElement(s,{font:"title3",align:"left",color:"textSecondary",marginBottom:12},o.i18nStrings.title),e.default.createElement(v,{rounded:!0,topLeft:o.i18nStrings.auto,end:e.default.createElement(T,{id:"auto-priority-fee-switch",checked:o.isAutoEnabled,onChange:o.onToggleAutoPriorityFee})}),e.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},o.i18nStrings.autoSubtitle)),!o.isAutoEnabled&&e.default.createElement(l,{gap:8,display:"flex",direction:"column"},e.default.createElement(H,{id:"priority-fee-input",label:"priority-fee-input",showLabel:!1,placeholder:"0.00",selectOnFocus:!0,value:o.customPriorityFeeValue??"",setValue:o.onChangeCustomPriorityFee,end:"SOL"}),e.default.createElement(s,{font:"caption",color:"textSecondary",align:"left",marginTop:8},o.customPriorityFeeValueInDollars),o.i18nStrings.subtitle&&e.default.createElement(s,{font:"caption",color:"textSecondary",align:"left",marginTop:8},o.i18nStrings.subtitle),e.default.createElement(l,{minHeight:32},o.error&&e.default.createElement(s,{font:"caption",color:o.error.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},o.error.message)))))),e.default.createElement(U,{removeFooterExpansion:!1,cssOverride:E`
          background: #2b2b2b;
          display: flex;
          justify-content: center;
        `},e.default.createElement(l,{paddingX:16,paddingBottom:12,width:"100%"},e.default.createElement(O,{disabled:c,theme:"primary",onClick:i},t.i18nStrings.button))))},ft=()=>{let{handleHideModalVisibility:t}=w(),o=(0,e.useCallback)(()=>{t("swapSettings")},[t]),i=b({onDismiss:o}),n=L({onDismiss:o}),c=(0,e.useCallback)(()=>{i.onConfirm(),n.onConfirm()},[i,n]),f=(0,e.useCallback)(()=>{i.onDismiss(),n.onDismiss()},[i,n]),m=(0,e.useMemo)(()=>i.submitDisabled||n.submitDisabled,[i.submitDisabled,n.submitDisabled]);return{slippageSettingsProps:i,priorityFeeSettingsProps:n,onConfirm:c,onDismiss:f,submitDisabled:m}},Y=()=>{let t=ft();return e.default.createElement(gt,{...t})};var ht=()=>{switch(B()){case"autoWithPriorityFees":return D.default.createElement(Y,null);case"auto":return D.default.createElement(z,null);default:return D.default.createElement(j,null)}},Zt=ht;export{ht as SwapSettings,Zt as default};
//# sourceMappingURL=SwapSettings-Y3DGCTED.js.map
