import{_ as c}from"./BasicForm.vue_vue_type_script_setup_true_lang-BytXd2pX.js";import"./BasicForm.vue_vue_type_style_index_0_lang-okE72qnf.js";import"./componentMap-MqTR0MBw.js";import{C as d,b as f}from"./entry/index-1TKHoTx5.js";import{P as _}from"./index-CD47rhsm.js";import{M as i,C as a}from"./index-DKyM2lOA.js";import{d as g,Z as b,a6 as C,a7 as n,k as s,u as o,l as p}from"./vue-9Ud1LID3.js";import"./FormItem.vue_vue_type_script_lang-Vhq4_IS5.js";import"./helper-CnLTYaT7.js";import"./antd-CW-Gcvvf.js";import"./index-C_lxP5Yl.js";import"./useWindowSizeFn-Dso5eH-h.js";import"./useFormItem-DEbYzuoO.js";import"./RadioButtonGroup.vue_vue_type_script_setup_true_lang-DKO4BWgA.js";import"./index-CCMQNgqc.js";import"./uuid-D0SLUWHI.js";import"./useSortable-DbiSqEn7.js";import"./useModal-B5NPGdGu.js";import"./download-CCk81ud_.js";import"./base64Conver-sUr-KUg7.js";import"./index-BqZDhD0R.js";import"./IconPicker.vue_vue_type_script_setup_true_lang-BMFbO9Af.js";import"./copyTextToClipboard-BUK7yJaA.js";import"./index-CZUO-sV0.js";import"./index-mWH8vxCs.js";import"./useContentViewHeight-Ds3VKhh3.js";import"./onMountedOrActivated-Cs7lj5CS.js";const G=g({__name:"Editor",setup(h){const m=[{field:"title",component:"Input",label:"title",defaultValue:"标题",rules:[{required:!0}]},{field:"JSON",component:"Input",label:"JSON",defaultValue:`{
        "name":"BeJson",
        "url":"http://www.xxx.com",
        "page":88,
        "isNonProfit":true,"
        address:{ 
            "street":"科技园路.",
            "city":"江苏苏州",
            "country":"中国"
        },
}`,rules:[{required:!0,trigger:"blur"}],render:({model:e,field:t})=>p(a,{value:e[t],mode:i.JSON,onChange:r=>{e[t]=r},config:{tabSize:10}})},{field:"PYTHON",component:"Input",label:"PYTHON",defaultValue:`def functionname( parameters ):
   "函数_文档字符串"
   function_suite
   return [expression]`,rules:[{required:!0,trigger:"blur"}],render:({model:e,field:t})=>p(a,{value:e[t],mode:i.PYTHON,onChange:r=>{e[t]=r}})}],{createMessage:u}=f();function l(e){u.success("click search,values:"+JSON.stringify(e))}return(e,t)=>(b(),C(o(_),{title:"代码编辑器组件嵌入Form示例"},{default:n(()=>[s(o(d),{title:"代码编辑器组件"},{default:n(()=>[s(o(c),{labelWidth:100,schemas:m,actionColOptions:{span:24},baseColProps:{span:24},onSubmit:l})]),_:1})]),_:1}))}});export{G as default};
