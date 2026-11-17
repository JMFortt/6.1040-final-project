# Concepts

- [ReferencePhotoBinning](concepts/ReferencePhotoBinning.md)
- [CoverageTracking](concepts/CoverageTracking.md)
- [TimeLapsing](concepts/TimeLapsing.md)
- [StreakTracking](concepts/StreakTracking.md)

## Application reaction

```reaction
reaction finishDrawing
  when Requesting.SubmitDrawing(user, drawing, referenceImage)
  then
    CoverageTracking.addImage(image: referenceImage)
    StreakTracking.engage(user)
```
