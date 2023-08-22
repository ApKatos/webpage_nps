import{I as C}from"./InfoTag-1c8e809c.js";import{_ as k}from"./router-39b327f3.js";import{L as D,E as V,F as E,N as e,m as l,G as r,I as i,ad as _,ap as A,H as c,Q as M,R as G}from"./index-1368dea8.js";import"./transition-7f0ce900.js";const R="/assets/patients_points_circles_updated-07fe3c7b.png",W="/assets/NPS2_coords_general_cb0_update-365ff77c.png";const z={components:{InfoTag:C},data(){return{briefVisible:!1,detailedVisible:!1,JSONresult:""}},methods:{drawNPSGraph(a,m,b,S){const s=a,t=s.getContext("2d"),p=1409,h=1410,d=Math.min(1e3,1e3*(p/h)),g=new Image;g.src=m;let N=b+0;console.log(N);let x=1-S+0;console.log(x),g.onload=function(){const u=d/Math.max(p,h),P=p*u,I=h*u,O=(d-P)/2,w=(d-I)/2;s.width=d,s.height=d,t.drawImage(g,O,w,P,I);const J=O+N*p*u,T=w+x*h*u;var f={radius:5,color:"red",width:10},v={radius:11,color:"black",width:6};t.beginPath(),t.arc(J,T,f.radius,0,2*Math.PI,!1),t.closePath(),t.lineWidth=f.width,t.strokeStyle=f.color,t.stroke(),t.beginPath(),t.arc(J,T,v.radius,0,2*Math.PI,!1),t.closePath(),t.lineWidth=v.width,t.strokeStyle=v.color,t.stroke()}}},computed:{phenotypesdescribed(){return"Phenotypes represent the timed evolution of disease in range of 1-25. The closer to phenotype 25 the more developed the disease"},probdeathdescribed(){return"Out of all patiens from given phenotype group, displayed percentage of patients died at the end of their disease"},nps2info(){return"If the patient's location is in the grey area then their disease progress can still be greatly influenced"},aliveInfo(){return"This patient belongs to the surviving propotion of the phenotype"},deadInfo(){return"This patient belongs to the dying proportion of the phenotype group"},nps1info(){return"This image informs about the progress of disease. Development of disease is described by 25 phenotypes divided into 3 colors according to the severity of the disease. The closer the patient to 25, the more advanced stage of the disease they have. Numbers close to 1 indicate earlier stages and beginnings of the disease."}},mounted(){this.JSONresult=JSON.parse(this.$route.query.result),this.drawNPSGraph(this.$refs.nps1_picture,R,this.JSONresult.NPS1.x,this.JSONresult.NPS1.y),this.drawNPSGraph(this.$refs.nps2_picture,W,this.JSONresult.NPS2.x,this.JSONresult.NPS2.y)}},y=a=>(M("data-v-438183c2"),a=a(),G(),a),B={class:"mainscreen"},H=y(()=>e("div",null,[e("h1",null,"RESULTS")],-1)),L={class:"results-container"},X={style:{"padding-right":"5vw"}},Y={style:{display:"grid","grid-template-columns":"auto"}},q={ref:"nps1_picture",class:"frame"},F={class:"container-left"},Q=y(()=>e("div",{class:"phenotype-text"},[e("p",null,"Patient's phenotype group:")],-1)),U={class:"phenotype-number"},j={class:"phenotype-info"},K=y(()=>e("div",{class:"probability-text"},[e("p",null,"Death probability among the group:")],-1)),Z={class:"probability-number"},$={class:"probability-info"},ee={style:{"padding-left":"5vw"}},te={style:{display:"grid","grid-template-columns":"auto"}},se={ref:"nps2_picture",class:"frame"},oe={class:"container-right"},ie={class:"alive"},ne={class:"dead"};function ae(a,m,b,S,o,n){const s=D("info-tag");return V(),E("div",B,[H,e("div",L,[e("div",X,[e("div",Y,[e("canvas",q,null,512),l(s,{style:{position:"absolute","margin-left":"-40px"}},{default:r(()=>[c(i(n.nps1info),1)]),_:1})]),e("div",F,[Q,e("div",U,[e("label",null,i(o.JSONresult.TimePhenotype),1)]),e("div",j,[l(s,null,{default:r(()=>[c(i(n.phenotypesdescribed),1)]),_:1})]),K,e("div",Z,[e("label",null,i(Math.round(o.JSONresult.ProbOfDeath))+"% ",1)]),e("div",$,[l(s,null,{default:r(()=>[c(i(n.probdeathdescribed),1)]),_:1})])])]),e("div",ee,[e("div",te,[e("canvas",se,null,512),l(s,{style:{position:"absolute","margin-left":"-40px"}},{default:r(()=>[c(i(n.nps2info),1)]),_:1})]),e("div",oe,[e("div",ie,[e("label",{style:_([{color:o.JSONresult.Alive?"greenyellow":"gray"},{"margin-left":"55px"}]),class:A({"highlighted-label":o.JSONresult.Alive})}," ALIVE ",6),l(s,{style:_([{visibility:o.JSONresult.Alive?"visible":"hidden"},{"margin-left":"5px","margin-top":"8px"}])},{default:r(()=>[c(i(n.aliveInfo),1)]),_:1},8,["style"])]),e("div",ne,[e("label",{style:_([{color:o.JSONresult.Alive?" grey":"tomato"},{"margin-left":"55px"}]),class:A({"highlighted-label":!o.JSONresult.Alive})}," DEAD ",6),l(s,{style:_([{visibility:(o.JSONresult.Alive,"hidden")},{"margin-left":"5px","margin-top":"8px"}])},{default:r(()=>[c(i(n.deadInfo),1)]),_:1},8,["style"])])])])])])}const pe=k(z,[["render",ae],["__scopeId","data-v-438183c2"]]);export{pe as default};
