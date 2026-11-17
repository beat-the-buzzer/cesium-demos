import{u as b}from"./useFormDesignState-GF5r4yYu.js";import{f as h,g as v}from"./index-BivS7lVZ.js";import{C as y,M}from"./index-DZMZChcN.js";import{b as I,_ as U}from"./entry/index-2p-jChXC.js";import{M as j,aD as k}from"./antd-CW-Gcvvf.js";import{d as J,I as _,r as g,a5 as l,Z as O,a6 as w,a7 as s,$ as f,k as n,G as p}from"./vue-9Ud1LID3.js";import"./useWindowSizeFn-Ih-oAg-7.js";const D=J({name:"ImportJsonModal",components:{CodeEditor:y,Upload:k,Modal:j},setup(){const{createMessage:e}=I(),o=g({visible:!1,json:`{
  "schemas": [
    {
      "component": "input",
      "label": "输入框",
      "field": "input_2",
      "span": 24,
      "props": {
        "type": "text"
      }
    }
  ],
  "layout": "horizontal",
  "labelLayout": "flex",
  "labelWidth": 100,
  "labelCol": {},
  "wrapperCol": {}
}`,jsonData:{schemas:{},config:{}},handleSetSelectItem:null}),{formDesignMethods:i}=b(),r=()=>{o.visible=!1},m=()=>{o.visible=!0},d=()=>{try{const a=JSON.parse(o.json);a.schemas&&h(a.schemas,t=>{v(t)}),i.setFormConfig({...a,activeKey:1,currentItem:{component:""}}),r(),e.success("导入成功")}catch{e.error("导入失败，数据格式不对")}};return{handleImportJson:d,beforeUpload:a=>{const t=new FileReader;return t.readAsText(a),t.onload=function(){o.json=this.result,d()},!1},handleCancel:r,showModal:m,..._(o),MODE:M}}}),E={class:"v-json-box"};function N(e,o,i,r,m,d){const c=l("CodeEditor"),a=l("a-button"),t=l("Upload"),u=l("Modal");return O(),w(u,{title:"JSON数据",open:e.visible,onOk:e.handleImportJson,onCancel:e.handleCancel,cancelText:"关闭",destroyOnClose:!0,wrapClassName:"v-code-modal",style:{top:"20px"},width:850},{footer:s(()=>[n(a,{onClick:e.handleCancel},{default:s(()=>[...o[1]||(o[1]=[p("取消",-1)])]),_:1},8,["onClick"]),n(t,{class:"upload-button",beforeUpload:e.beforeUpload,showUploadList:!1,accept:"application/json"},{default:s(()=>[n(a,{type:"primary"},{default:s(()=>[...o[2]||(o[2]=[p("导入json文件",-1)])]),_:1})]),_:1},8,["beforeUpload"]),n(a,{type:"primary",onClick:e.handleImportJson},{default:s(()=>[...o[3]||(o[3]=[p("确定",-1)])]),_:1},8,["onClick"])]),default:s(()=>[o[4]||(o[4]=f("p",{class:"hint-box"},"导入格式如下:",-1)),f("div",E,[n(c,{value:e.json,"onUpdate:value":o[0]||(o[0]=C=>e.json=C),ref:"myEditor",mode:e.MODE.JSON},null,8,["value","mode"])])]),_:1},8,["open","onOk","onCancel"])}const K=U(D,[["render",N],["__scopeId","data-v-62ebfefa"]]);export{K as default};
