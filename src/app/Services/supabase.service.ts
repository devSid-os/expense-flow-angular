import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../enviroments/enviroment';
import { LoadingService } from './loading.service';
import { v4 as uuidv4 } from "uuid";

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

    async deleteFileFromUrl(fileUrl: string, bucketName: string): Promise<void> {
        // Extract the file name (or path) from the URL
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1]; // Get the last part after the last "/"


        const { data, error } = await this.supabase.storage.from(bucketName).remove([fileName]);

        if (error) {
            console.error('Error deleting file:', error.message);
            throw new Error('Could not delete the file.');
        }
    }


    // Upload Image to Supabase Storage
    async uploadImage(file: File, fileName: string, bucketName: string): Promise<any> {
        this._loadingServ.loading.set(true);
        const uniqueFileName = `${uuidv4()}_${fileName}`;
        const { data, error } = await this.supabase.storage
            .from(bucketName) // Bucket name
            .upload(uniqueFileName, file, { upsert: true });

        if (error) {
            console.error('Upload Error:', error);
            this._loadingServ.loading.set(false);
            return { error: error.message };
        }
        this._loadingServ.loading.set(false);
        return { url: this.getImageUrl(uniqueFileName, bucketName) };
    }

    // Get Public URL of Image
    getImageUrl(fileName: string, bucketName: string): string {
        return this.supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl;
    }
}