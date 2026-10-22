export class AIClient{
 constructor(endpoint="/api/math-assistant"){this.endpoint=endpoint;this.enabled=false;}
 async ask(prompt){try{const response=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});if(response.status===404||response.status===503)return null;if(!response.ok)throw new Error(`AI service returned ${response.status}`);const data=await response.json();return typeof data.answer==="string"?data.answer:null;}catch(error){return null;}}
}
