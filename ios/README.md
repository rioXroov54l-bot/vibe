# Vibe iOS

This directory contains the native SwiftUI application scaffold for the Vibe
project.

## Generate the Xcode project

```sh
brew install xcodegen
cd ios
xcodegen generate
open Vibe.xcodeproj
```

## Required configuration

The application reads Supabase connection values from `Info.plist` build
settings. Do not commit production secrets.

- `VIBE_SUPABASE_URL`
- `VIBE_SUPABASE_ANON_KEY`

The existing Supabase project and all current users/data must remain the source
of truth.
