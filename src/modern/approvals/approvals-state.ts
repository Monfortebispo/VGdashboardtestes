export interface ApprovalsSelection{hotel:string;type:string;status:string;}
type Listener=(s:Readonly<ApprovalsSelection>)=>void;
class Store{private s:ApprovalsSelection={hotel:'__all__',type:'__all__',status:'__all__'};private ls=new Set<Listener>();current(){return Object.freeze({...this.s});}replace(n:Partial<ApprovalsSelection>){const next={...this.s,...n};const changed=JSON.stringify(next)!==JSON.stringify(this.s);this.s=next;if(changed)this.ls.forEach(l=>l(this.current()));return this.current();}subscribe(l:Listener){this.ls.add(l);return()=>this.ls.delete(l);}}
export const approvalsState=new Store();
