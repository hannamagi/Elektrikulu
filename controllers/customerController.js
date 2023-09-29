import { Request, Response, Router } from "express";
const router: Router = Router();

router.get('/hello', (req: Request, res: Response) => {
    res.send('hello new controller file');
});

export default router;
