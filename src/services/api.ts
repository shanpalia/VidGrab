import { MediaMetadata, FormatsResponse, DownloadProgressInfo, DownloadStatus } from '../types';

export interface ApiErrorResponse { success: false; errorCode: string; message: string; }
export interface InitDownloadParams { formatId: string; fileName?: string; customTitle?: string; url?: string; mediaId?: string; durationSeconds?: number; thumbnail?: string; type?: string; previewUrl?: string; }
export interface InitDownloadResponse { success: boolean; downloadId: string; fileName: string; ext: string; formatLabel: string; mediaType: 'video'|'audio'|'image'; totalBytes: number; fileSizeStr: string; contentType: string; fileUrl: string; progressUrl: string; }

export class ApiService {
  static async getMetadata(url: string): Promise<MediaMetadata> {
    const response = await fetch('/api/metadata', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || this.mapErrorCode(data.errorCode || 'BACKEND_ERROR'));
    return data.data;
  }
  static async getFormats(durationSeconds=180, availableQualities:string[]=[], url?:string):Promise<FormatsResponse>{
    const response=await fetch('/api/formats',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({durationSeconds,qualities:availableQualities,url})});
    const data=await response.json(); if(!response.ok||!data.success) throw new Error(data.message||'Failed to retrieve available formats.');
    return {audioFormats:data.audioFormats||[],videoFormats:data.videoFormats||[],imageFormats:data.imageFormats||[]};
  }
  static async initDownload(params:InitDownloadParams):Promise<InitDownloadResponse>{const response=await fetch('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)});const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||this.mapErrorCode(data.errorCode||'DOWNLOAD_ERROR'));return data;}
  static async getProgress(downloadId:string):Promise<DownloadProgressInfo>{const response=await fetch(`/api/download/${encodeURIComponent(downloadId)}/progress`);const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||'Failed to check download progress.');return {downloadId:data.downloadId,status:data.status,percent:data.percent,downloadedBytes:data.downloadedBytes,totalBytes:data.totalBytes,speed:data.speed,fileName:data.fileName,formatLabel:data.formatLabel,ext:data.ext,type:data.mediaType,thumbnail:data.thumbnail,errorMessage:data.errorMessage};}
  static async cancelDownload(downloadId:string):Promise<boolean>{try{const r=await fetch(`/api/download/${encodeURIComponent(downloadId)}/cancel`,{method:'POST'});return r.ok;}catch{return false;}}
  static async downloadFileStream(downloadId:string,signal?:AbortSignal,onProgress?:(info:{percent:number;downloadedBytes:number;totalBytes:number;speed:string;status:DownloadStatus})=>void):Promise<{blob:Blob;contentType:string}>{
    const response=await fetch(`/api/download/${encodeURIComponent(downloadId)}/file`,{signal});if(!response.ok)throw new Error('Failed to retrieve media file from server.');
    const contentType=response.headers.get('Content-Type')||'video/mp4';const totalBytes=parseInt(response.headers.get('Content-Length')||'0',10);
    if(!response.body){const blob=await response.blob();onProgress?.({percent:100,downloadedBytes:blob.size,totalBytes:totalBytes||blob.size,speed:'0 B/s',status:'completed'});return{blob,contentType};}
    const reader=response.body.getReader();const chunks:Uint8Array[]=[];let downloadedBytes=0,lastSampleTime=performance.now(),lastSampleBytes=0,speed='0 B/s';
    while(true){if(signal?.aborted)throw new Error('DOWNLOAD_CANCELLED');const{done,value}=await reader.read();if(done)break;if(value){chunks.push(value);downloadedBytes+=value.length;const now=performance.now(),dt=(now-lastSampleTime)/1000;if(dt>=.25){speed=this.formatSpeed((downloadedBytes-lastSampleBytes)/dt);lastSampleTime=now;lastSampleBytes=downloadedBytes;}const percent=totalBytes>0?Math.min(100,Math.round(downloadedBytes/totalBytes*100)):-1;onProgress?.({percent,downloadedBytes,totalBytes,speed,status:percent>=100?'converting':'downloading'});}}
    const blob=new Blob(chunks,{type:contentType});onProgress?.({percent:100,downloadedBytes:blob.size,totalBytes:totalBytes||blob.size,speed,status:'completed'});return{blob,contentType};
  }
  static formatSpeed(b:number){if(b<=0||!isFinite(b))return'0 B/s';if(b<1024)return`${Math.round(b)} B/s`;if(b<1048576)return`${(b/1024).toFixed(1)} KB/s`;if(b<1073741824)return`${(b/1048576).toFixed(1)} MB/s`;return`${(b/1073741824).toFixed(2)} GB/s`;}
  static formatBytes(b:number){if(b<=0||!isFinite(b))return'0 MB';if(b<1024)return`${b} B`;if(b<1048576)return`${(b/1024).toFixed(1)} KB`;if(b<1073741824)return`${(b/1048576).toFixed(1)} MB`;return`${(b/1073741824).toFixed(2)} GB`;}
  static mapErrorCode(code:string){switch(code){case'INVALID_URL':return'Please enter a valid media link.';case'UNSUPPORTED_WEBSITE':return'This website is not currently supported.';case'PRIVATE_CONTENT':return'This media is private or DRM-restricted.';case'NO_MEDIA':return'No downloadable media streams were found.';case'BACKEND_ERROR':return'VidGrab backend service is temporarily busy.';case'CONVERSION_ERROR':return'Unable to convert this media.';case'DOWNLOAD_ERROR':return'Download interrupted. Please retry.';case'DOWNLOAD_CANCELLED':return'Download was cancelled.';default:return'An unexpected error occurred.';}}
  static async grab(url:string){try{const r=await fetch('/api/grab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});return await r.json();}catch{return{downloadable:false,message:'No downloadable media detected.'};}}
  static async getYouTubeSuggestions(query:string):Promise<string[]>{if(!query.trim())return[];try{const r=await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(query.trim())}`);const d=await r.json();return d.suggestions||[];}catch{return[];}}

  // Real search for APKs: local backend first, then several public unauthenticated
  // providers. Each provider is optional so one outage does not break search.
  static async getYouTubeSearchFromPublicApi(query:string):Promise<any[]>{
    const q=query.trim();if(!q)return[];
    const providers=[
      {base:'https://pipedapi.kavin.rocks',kind:'piped'},
      {base:'https://pipedapi.leptons.xyz',kind:'piped'},
      {base:'https://pipedapi.nosebs.ru',kind:'piped'},
      {base:'https://pipedapi.adminforge.de',kind:'piped'},
      {base:'https://api.piped.yt',kind:'piped'},
      {base:'https://yewtu.be',kind:'invidious'},
      {base:'https://yt.artemislena.eu',kind:'invidious'},
      {base:'https://inv.tux.pizza',kind:'invidious'}
    ];
    for(const p of providers){
      try{
        const endpoint=p.kind==='piped'?`${p.base}/search?q=${encodeURIComponent(q)}&filter=videos`:`${p.base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1&region=IN`;
        const r=await fetch(endpoint,{signal:AbortSignal.timeout(7000)});if(!r.ok)continue;const d=await r.json();
        const raw=p.kind==='piped'?(Array.isArray(d?.items)?d.items:[]):(Array.isArray(d)?d:[]);
        const out=raw.filter((x:any)=>p.kind==='piped'?x?.type==='stream'&&x?.id:x?.type==='video'&&x?.videoId).slice(0,20).map((x:any)=>{const id=p.kind==='piped'?x.id:x.videoId;const thumbs=x.videoThumbnails||[];return{id,title:x.title||'YouTube Video',channel:p.kind==='piped'?(x.uploaderName||'YouTube'):(x.author||'YouTube'),views:x.viewCount?`${x.viewCount} views`:(x.views?`${x.views} views`:''),publishedAt:x.publishedText||x.uploadedDate||'',duration:x.lengthSeconds?`${Math.floor(x.lengthSeconds/60)}:${String(x.lengthSeconds%60).padStart(2,'0')}`:(x.duration||''),thumbnail:p.kind==='invidious'?(thumbs[thumbs.length-1]?.url||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`):(x.thumbnail||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`),url:`https://www.youtube.com/watch?v=${id}`,videoUrl:`https://www.youtube.com/watch?v=${id}`};});
        if(out.length)return out;
      }catch{}
    }
    return [];
  }

  static async getYouTubeSearch(query:string):Promise<any[]>{
    if(!query.trim())return[];
    try{const r=await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`,{signal:AbortSignal.timeout(7000)});const d=await r.json();if(Array.isArray(d.results)&&d.results.length)return d.results;}catch{}
    return this.getYouTubeSearchFromPublicApi(query);
  }
  static async getYouTubeFeed(category:string='all'):Promise<any[]>{try{const r=await fetch(`/api/youtube/feed?category=${encodeURIComponent(category)}`);const d=await r.json();return d.results||[];}catch{return[];}}
  static async checkFrameEmbeddable(url:string){try{const r=await fetch(`/api/browser/frame-check?url=${encodeURIComponent(url)}`);return await r.json();}catch{return{embeddable:false,reason:'network_restriction'};}}
}
