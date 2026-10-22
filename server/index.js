import "dotenv/config";
import express from "express";
import cors from "cors";

const app=express();
app.use(cors({origin:process.env.ALLOWED_ORIGIN||true}));
app.use(express.json({limit:"1mb"}));
app.get("/api/health",(_req,res)=>res.json({ok:true,aiConfigured:Boolean(process.env.OPENAI_API_KEY)}));
app.post("/api/math-assistant",async(req,res)=>{
  const prompt=String(req.body?.prompt||"").trim();
  if(!prompt)return res.status(400).json({error:"prompt is required"});
  if(prompt.length>4000)return res.status(413).json({error:"prompt is too long"});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"AI is not configured. Add OPENAI_API_KEY to server/.env or project .env."});
  try{
    const upstream=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.AI_MODEL||"gpt-4.1-mini",
        input:[
          {role:"system",content:[{type:"input_text",text:"You are a precise, friendly mathematics tutor for an interactive smartboard. Explain the math clearly, distinguish exact from approximate values, use valid formulas, and never claim to draw a figure. The frontend currently supports triangles, circles, squares, a cube, coordinate points, and simple function graphs."}]},
          {role:"user",content:[{type:"input_text",text:prompt}]}
        ]
      })
    });
    const data=await upstream.json();
    if(!upstream.ok)return res.status(upstream.status).json({error:data.error?.message||"AI provider request failed"});
    const answer=(data.output||[]).flatMap(item=>item.content||[]).filter(c=>c.type==="output_text").map(c=>c.text).join("\n");
    return res.json({answer:answer||"I could not generate an explanation for that request."});
  }catch(error){return res.status(502).json({error:"Could not reach the AI provider."});}
});
const port=Number(process.env.PORT||8787);
app.listen(port,()=>console.log(`Math Board API listening on http://localhost:${port}`));
