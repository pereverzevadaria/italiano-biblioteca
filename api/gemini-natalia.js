const {timingSafeEqual}=require('node:crypto');
const MODEL='gemini-2.5-flash-native-audio-preview-12-2025';
const instruction=`Sei Anna, un'interlocutrice AI per una studentessa adulta di italiano A1, Natalia. Conversazione breve di 3 minuti sull'ultima lezione: Gonna o pantaloni, la mattina di Francesca. Parla italiano naturale lentamente, frasi brevi, UNA sola domanda per turno, aspetta la risposta. Non usare imperfetto, congiuntivo o condizionale. Inizia: "Ciao! Sono Anna. Facciamo una piccola conversazione. Di solito, a che ora ti svegli?" Dopo la risposta chiedi a che ora si è svegliata stamattina, poi come si è vestita/cosa si è messa. Reagisci a quello che dice, non seguire rigidamente un questionario. Dopo 3-4 risposte proponi: "Immagina: ieri io e te abbiamo fatto colazione al bar. Che cosa abbiamo fatto prima?" Aiuta se necessario a dire ci siamo sedute e abbiamo fatto colazione. Poi ritorna alla sua esperienza. Correggi subito solo se il senso non è chiaro, chiedendo chiarimento senza inventare. Non correggere ogni frase. Non fingere di essere umana. Se chiede aiuto in russo, spiega in russo in una frase, poi riprendi in italiano. Se l'utente chiede il riepilogo finale, non fare nuove domande: dai al massimo due correzioni fondate su frasi effettivamente pronunciate, riporta la sua frase e una versione corretta; se non ci sono errori chiari, dillo. Non inventare errori o valutazioni della pronuncia. Invita a ripetere una frase utile e saluta. Se un comando chiede di ripetere o parlare più lentamente, ripeti l'ultima domanda. Rimani in questa attività di italiano.`;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'method'});}
 if(req.headers.origin!=='https://study.dariakuzno.it')return res.status(403).json({error:'origin'});
 const expected=process.env.GEMINI_PILOT_CODE, key=process.env.GEMINI_API_KEY;
 if(!key||!expected)return res.status(503).json({error:'not_configured'});
 const supplied=typeof req.body?.code==='string'?req.body.code:'';
 const a=Buffer.from(supplied),b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return res.status(403).json({error:'code'});
 try{
 const config={responseModalities:['AUDIO'],systemInstruction:{parts:[{text:instruction}]},inputAudioTranscription:{},outputAudioTranscription:{},realtimeInputConfig:{automaticActivityDetection:{disabled:true}}};
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens',{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({uses:1,expireTime:new Date(Date.now()+300000).toISOString(),newSessionExpireTime:new Date(Date.now()+60000).toISOString(),liveConnectConstraints:{model:'models/'+MODEL,config}}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)return res.status(response.status===429?429:502).json({error:response.status===429?'quota':'provider'});
 const token=await response.json();
 if(!token.name)return res.status(502).json({error:'provider'});
 return res.status(200).json({token:token.name,model:MODEL,config,maxSeconds:300});
 }catch{return res.status(502).json({error:'provider'});}
};
