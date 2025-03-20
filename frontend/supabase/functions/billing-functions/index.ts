import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import {billingFunctionsWrapper, stripeFunctionHandler} from "https://deno.land/x/basejump@v2.0.3/billing-functions/mod.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno&no-check";

const stripeClient = new Stripe(Deno.env.get("STRIPE_API_KEY") as string, {
    apiVersion: "2022-11-15", 
    httpClient: Stripe.createFetchHttpClient(),
});

const stripeHandler = stripeFunctionHandler({
    stripeClient,
    defaultPlanId: Deno.env.get("STRIPE_DEFAULT_PLAN_ID") as string,
    defaultTrialDays: Deno.env.get("STRIPE_DEFAULT_TRIAL_DAYS") ? Number(Deno.env.get("STRIPE_DEFAULT_TRIAL_DAYS")) : undefined
});

const billingEndpoint = billingFunctionsWrapper(stripeHandler, {
    allowedURLs: ['http://localhost:3000']
});

Deno.serve(async (req) => {
    console.log(req);
    const response = await billingEndpoint(req);
    return response;
});
