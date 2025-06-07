-- RLS Policies for CollectionVideo, Purchase, VerificationToken

-- Enable Row Level Security
ALTER TABLE public."CollectionVideo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their own purchases
CREATE POLICY "select_own_purchases" ON public."Purchase"
FOR SELECT USING ( auth.uid() = user_id );

-- Allow authenticated users to select their own verification tokens
CREATE POLICY "select_own_verification_tokens" ON public."VerificationToken"
FOR SELECT USING ( auth.uid() = identifier );

-- Deny inserts/updates on CollectionVideo except service role (no policy) 