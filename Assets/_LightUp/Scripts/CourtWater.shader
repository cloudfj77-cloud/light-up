Shader "Light Up/Court Water"
{
    Properties
    {
        _Color ("Water color", Color) = (0.075,0.21,0.26,1)
        _FlowTime ("Flow time", Float) = 0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        CGPROGRAM
        #pragma surface surf Standard
        struct Input { float3 worldPos; };
        fixed4 _Color;
        float _FlowTime;
        void surf(Input IN, inout SurfaceOutputStandard o)
        {
            float wave = sin(IN.worldPos.x * 2.5 + _FlowTime * .6 + sin(IN.worldPos.z * 1.3));
            float ripple = pow(saturate(wave), 20);
            o.Albedo = _Color.rgb + ripple * float3(.035,.07,.08);
            o.Normal = normalize(float3(wave * .025, cos(IN.worldPos.z * 2 + _FlowTime * .4) * .025, 1));
            o.Metallic = .15;
            o.Smoothness = .45;
            o.Alpha = 1;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
