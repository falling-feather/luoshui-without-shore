$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskFontDirectory = Join-Path $taskRoot 'public/fonts'
if (-not (Test-Path -LiteralPath $taskFontDirectory -PathType Container)) { throw '字体输出父目录不存在。' }
$taskCodeText = (Get-ChildItem -LiteralPath (Join-Path $taskRoot 'src') -Recurse -File | Where-Object { $_.Extension -in @('.ts','.css') } | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw -Encoding utf8 }) -join ''
$taskAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?/|+-=()[]·，。；：“”《》、！？壹贰叁肆伍陆柒捌玖拾零一二三四五六七八九十百千万洛水无岸'
$taskCharacters = @((@([regex]::Matches($taskCodeText,'[ -鿿]') | ForEach-Object { $_.Value }) + @($taskAlphabet.ToCharArray() | ForEach-Object { [string]$_ })) | Sort-Object -Unique)
$taskAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
$taskFaces = [Collections.Generic.List[string]]::new()
$taskFiles = [Collections.Generic.List[object]]::new()
$taskTotalBytes = 0
# Long text= requests can return Google's entire unicode-split family. Require
# one real subset per bounded request rather than accepting its first file.
for ($taskOffset=0; $taskOffset -lt $taskCharacters.Count; $taskOffset+=140) {
  $taskEnd = [Math]::Min($taskOffset+139,$taskCharacters.Count-1)
  $taskChunk = @($taskCharacters[$taskOffset..$taskEnd])
  $taskUri = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400..700&display=swap&text=' + [Uri]::EscapeDataString(($taskChunk -join ''))
  $taskCss = (Invoke-WebRequest -Uri $taskUri -UserAgent $taskAgent -ErrorAction Stop).Content
  if (([regex]::Matches($taskCss,'@font-face')).Count -ne 1) { throw '字体服务未返回单个真实子集，停止更新。' }
  $taskMatch = [regex]::Match($taskCss,'src:\s*url\(([^)]+)\)\s*format\(''woff2''\)')
  if (-not $taskMatch.Success) { throw '字体子集不是 WOFF2。' }
  $taskFontUri = $taskMatch.Groups[1].Value
  if (([Uri]$taskFontUri).Host -ne 'fonts.gstatic.com') { throw '字体来源不符。' }
  $taskNumber = [int]($taskOffset/140)+1
  $taskName = 'luo-serif-part-{0:D2}.woff2' -f $taskNumber
  $taskOutput = Join-Path $taskFontDirectory $taskName
  Invoke-WebRequest -Uri $taskFontUri -OutFile $taskOutput -UserAgent $taskAgent -ErrorAction Stop
  $taskBytes = [IO.File]::ReadAllBytes($taskOutput)
  if ([Text.Encoding]::ASCII.GetString($taskBytes,0,4) -ne 'wOF2') { throw '字体文件校验失败。' }
  $taskRanges = ($taskChunk | ForEach-Object { 'U+{0:X}' -f [char]::ConvertToUtf32($_,0) }) -join ','
  $taskFaces.Add("@font-face{font-family:'Luo Serif';font-style:normal;font-weight:400 700;font-display:swap;src:url('./$taskName') format('woff2');unicode-range:$taskRanges;}")
  $taskFiles.Add([ordered]@{file=$taskName;characters=$taskChunk.Count;bytes=$taskBytes.Length})
  $taskTotalBytes += $taskBytes.Length
}
[IO.File]::WriteAllText((Join-Path $taskFontDirectory 'luo-serif.css'),($taskFaces -join [Environment]::NewLine),[Text.UTF8Encoding]::new($false))
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt' -OutFile (Join-Path $taskFontDirectory 'OFL.txt') -ErrorAction Stop
$taskMetadata=[ordered]@{family='Noto Serif SC';origin='https://fonts.google.com/noto/specimen/Noto+Serif+SC';license='SIL Open Font License 1.1';variable_weight='400-700';subset_characters=$taskCharacters.Count;source_of_subset='Current src/ text; bounded text requests with one verified subset each';stylesheet='luo-serif.css';fonts=$taskFiles;bytes=$taskTotalBytes}
[IO.File]::WriteAllText((Join-Path $taskFontDirectory 'source.json'),($taskMetadata|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
[PSCustomObject]@{characters=$taskCharacters.Count;parts=$taskFiles.Count;bytes=$taskMetadata.bytes}|ConvertTo-Json -Compress
