import{a as i,r as m}from"./index-BivS7lVZ.js";import l from"./PreviewCode-DUN4JGEE.js";import{M as d}from"./antd-CW-Gcvvf.js";import{d as p,I as c,c as f,r as u,a5 as s,Z as v,a6 as C,a7 as b,k as _}from"./vue-9Ud1LID3.js";import{_ as w}from"./entry/index-2p-jChXC.js";import"./index-DZMZChcN.js";import"./useWindowSizeFn-Ih-oAg-7.js";import"./copyTextToClipboard-BUK7yJaA.js";const D=`<template>
  <div>
    <v-form-create
      :formConfig="formConfig"
      :formData="formData"
      v-model="fApi"
    />
    <a-button @click="submit">提交</a-button>
  </div>
</template>
<script>

export default {
  name: 'Demo',
  data () {
    return {
      fApi:{},
      formData:{},
      formConfig: `;let M=`
    }
  },
  methods: {
    async submit() {
      const data = await this.fApi.submit()
      console.log(data)
     }
  }
}
<\/script>`;const h=p({name:"CodeModal",components:{PreviewCode:l,Modal:d},setup(){const o=u({visible:!1,jsonData:{}}),e=t=>{t.schemas&&i(t.schemas),o.visible=!0,o.jsonData=t},a=f(()=>D+JSON.stringify(m(o.jsonData),null,"	")+M);return{...c(o),editorVueJson:a,showModal:e}}});function J(o,e,a,t,V,$){const r=s("PreviewCode"),n=s("Modal");return v(),C(n,{title:"代码",footer:null,open:o.visible,onCancel:e[0]||(e[0]=k=>o.visible=!1),wrapClassName:"v-code-modal",style:{top:"20px"},width:"850px",destroyOnClose:!0},{default:b(()=>[_(r,{editorJson:o.editorVueJson,fileFormat:"vue"},null,8,["editorJson"])]),_:1},8,["open"])}const F=w(h,[["render",J]]);export{F as default};
