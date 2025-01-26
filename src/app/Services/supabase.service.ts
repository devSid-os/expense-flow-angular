import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../enviroments/enviroment';
import { LoadingService } from './loading.service';

@Injectable({
    providedIn: 'root'
})
export class SupaBaseService {
    private supabase: SupabaseClient;
    private _loadingServ = inject(LoadingService);
    constructor() {
        this.supabase = createClient(
            environment.SUPABASE_URL,
            environment.SUPABASE_KEY
        );
    }

    // Upload Image to Supabase Storage
    async uploadImage(file: File, path: string, bucketName: string): Promise<any> {
        this._loadingServ.loading.set(true);
        const { data, error } = await this.supabase.storage
            .from(bucketName) // Bucket name
            .upload(path, file, { upsert: true });

        if (error) {
            this._loadingServ.loading.set(false);
            console.error('Upload Error:', error);
            return { error: error.message };
        }
        this._loadingServ.loading.set(false);
        return { url: this.getImageUrl(path, bucketName) };
    }

    // Get Public URL of Image
    getImageUrl(path: string, bucketName: string): string {
        return this.supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl;
    }
}