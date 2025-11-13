// Upload GLB to Cloudflare R2
// Run: node upload-r2.js

const fs = require('fs');
const path = require('path');

// Install required package first: npm install @aws-sdk/client-s3

async function uploadToR2() {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    
    // R2 Credentials
    const accountId = process.env.R2_ACCOUNT_ID || 'b9f3134d03d531a465227b163d99b966';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '4c725f34999b94dce9de71cbc544be49';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || 'aba9eceb6b19d06066cf5cd247d4c5a67cc552f4907c44638315614c5b737e43';
    const bucketName = 'cavve-assets';
    const filePath = path.join(__dirname, 'public', 'the_batcave.glb');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      console.log('💡 Make sure the_batcave.glb is in the public/ folder');
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(filePath);
    const fileSizeMB = (fileContent.length / (1024 * 1024)).toFixed(2);
    
    console.log(`📦 Uploading ${fileSizeMB} MB file to R2...`);
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'the_batcave.glb',
      Body: fileContent,
      ContentType: 'model/gltf-binary',
    });
    
    await s3Client.send(command);
    
    console.log('✅ Upload successful!');
    console.log(`📂 File: the_batcave.glb`);
    console.log(`📊 Size: ${fileSizeMB} MB`);
    console.log(`\n🔗 Next steps:`);
    console.log(`1. Go to Cloudflare R2 → cavve-assets bucket`);
    console.log(`2. Enable Public Access in Settings`);
    console.log(`3. Copy the public URL (looks like: https://pub-xxxxx.r2.dev/the_batcave.glb)`);
    console.log(`4. Update Vercel env var: NEXT_PUBLIC_GLB_URL`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    if (error.message.includes('YOUR_')) {
      console.log('\n💡 Set environment variables:');
      console.log('   R2_ACCOUNT_ID=your_account_id');
      console.log('   R2_ACCESS_KEY_ID=your_access_key');
      console.log('   R2_SECRET_ACCESS_KEY=your_secret_key');
      console.log('\n   Or edit this file and replace YOUR_* values');
    }
    process.exit(1);
  }
}

uploadToR2();

